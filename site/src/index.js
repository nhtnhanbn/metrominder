import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import "leaflet-fullscreen";
import "leaflet-rotate";
import "leaflet-search/src/leaflet-search.css";
import "leaflet-search";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
import "leaflet.control.layers.tree";
import "leaflet.zoomhome";
import "leaflet.marker.slideto";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import { LocateControl } from "leaflet.locatecontrol";
import "./leaflet-arrowcircle/src/L.ArrowCircle.js";
import metroTrainGeojson from "./metroTrainRoutes.geojson";
import metroTramGeojson from "./metroTramRoutes.geojson";
import regionTrainGeojson from "./regionTrainRoutes.geojson";
import busGeojson from "./busRoutes.geojson";
import metroTrainStopData from "../../data/gtfsschedule/2/stops.txt";
import metroTramStopData from "../../data/gtfsschedule/3/stops.txt";
import regionTrainStopData from "../../data/gtfsschedule/1/stops.txt";
import busStopData from "../../data/gtfsschedule/4/stops.txt";
import { createRouteStructures } from "./routeMaps.js";
import { createStopStructures } from "./stopMaps.js";
import { vehicleMaps, vehicleByTripId } from "./vehicleMaps.js";
import { timeString } from "./stringConverters.js";
import { createIndexLayerTree } from "./indexLayerTree.js";
import { updatePositions, updateTrips } from "./updateRealtime.js";
import { createStopPopup } from "./stopPopup.js";
import metroTrainStopIcon from "./PICTO_MODE_Train.svg";
import regionTrainStopIcon from "./PICTO_MODE_RegionalTrain.svg";
import tramStopIcon from "./PICTO_MODE_Tram.svg";
import busStopIcon from "./PICTO_MODE_Bus.svg";
import "./style.css";

function computeMode(routeId) {
    if (routeId[0] !== 'a') {
        return "bus";
    } else if (routeId[13] === '1') {
        return "regionTrain";
    } else if (routeId[13] === '2') {
        return "metroTrain";
    } else if (routeId[13] === '3') {
        return "metroTram";
    }
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./serviceWorker.js")
            .then((res) => console.log("serviceWorker.js registered", res))
            .catch((err) => console.log("serviceWorker.js not registered", err))
    })
};

const modes = ["metroTrain", "regionTrain", "metroTram", "bus"];
const { routeMaps, routeById, routeByCode } = createRouteStructures(modes, {
    metroTrainGeojson: metroTrainGeojson,
    metroTramGeojson: metroTramGeojson,
    regionTrainGeojson: regionTrainGeojson,
    busGeojson: busGeojson
});
const { stopMaps, stopById, stopByName, platformById } = createStopStructures(modes, routeMaps, {
    metroTrainStopData: metroTrainStopData,
    metroTramStopData: metroTramStopData,
    regionTrainStopData: regionTrainStopData,
    busStopData: busStopData
});

const state = {
    vehicleMarkerLabelSelection: "route"
}

const searchLayer = L.layerGroup();
const stopLayer = L.layerGroup();

const map = L.map("map", {
    zoomControl: false,
    zoomSnap: 0,
    fullscreenControl: true,
    rotate: true,
    rotateControl: { closeOnZeroBearing: false },
    touchRotate: true
}).fitBounds([[-38.4, 145.6], [-37.5, 144.5]]);

map.createPane("vehiclePane", map.getPane("norotatePane")).style.zIndex = 625;
map.createPane("metroRoutePane", map.getPane("rotatePane")).style.zIndex = 450;
map.createPane("regionRoutePane", map.getPane("rotatePane")).style.zIndex = 425;

L.Control.zoomHome().addTo(map);
L.control.scale().addTo(map);

// Open popups on the bottom
map.addEventListener("popupopen", ({popup}) => {
    popup._wrapper.remove();
    popup._container.appendChild(popup._wrapper);
});

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        opacity: 0.5,
        attribution: `&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>`
    }
).addTo(map);

// Reset rotation when controller clicked
map.rotateControl.getContainer().addEventListener("mouseup", () => {
    map.setBearing(0);
    if (!map.touchRotate.enabled()) {
        setTimeout(() => { map.setBearing(0) }, 100);
    }
});

(new LocateControl({
    setView: "untilPan",
    flyTo: true,
    initialZoomLevel: 14,
    clickBehavior: {
        inView: "stop",
        inViewNotFollowing: "setView",
        outOfView: "setView"
    },
    compassStyle: {
        rotateWithView: true
    }
})).addTo(map);

(new (L.Control.extend({
    onAdd: (map) => {
        const title = L.DomUtil.create("a", "watermark");
        title.title = "About MetroMinder";
        
        const metro = L.DomUtil.create("span", null, title);
        metro.style.fontWeight = 1;
        metro.textContent = "METRO";

        const minder = L.DomUtil.create("span", null, title);
        minder.style.fontWeight = 1000;
        minder.textContent = "MINDER";
        
        const about = document.querySelector("dialog");
        title.addEventListener("click", (event) => {
            event.preventDefault();
            about.showModal();
        });
        
        return title;
    },
    
    onRemove: (map) => {}
}))({
    position: "topright"
})).addTo(map);

let foundMarker;
(new L.Control.Search({
    position: "topright",
    layer: searchLayer,
    zoom: 14,
    initial: false,
    delayType: 0,
    firstTipSubmit: true,
    autoResize: false,
    autoCollapse: true,
    autoCollapseTime: 1e9,
    textErr: "Feature not found.",
    textPlaceholder: "Search stops and routes...                         ",
    marker: false
})).addEventListener("search:locationfound", (data) => {
    if (
        foundMarker &&
        (foundMarker.options.visibility == 0 || !map.hasLayer(stopLayer))
    ) {
        foundMarker.remove();
    }
    
    foundMarker = data.layer;
    foundMarker.addTo(map);
    foundMarker.openPopup();
}).addTo(map);
searchLayer.remove();

const layerGroupByMode = {
    metroTrain: L.layerGroup(),
    regionTrain: L.layerGroup(),
    metroTram: L.layerGroup(),
    bus: L.layerGroup()
};

for (const routeMap of routeMaps) {
    routeMap.layerGroup = L.layerGroup();

    const geojsonLayer = L.geoJSON(
        routeMap.geojson,
        {
            style: { color: routeMap.routeColour },
            pane: routeMap.routeId[13] === '2' ? "metroRoutePane": "regionRoutePane"
        }
    );
    geojsonLayer.addTo(routeMap.layerGroup);
    
    routeMap.layerGroup.addEventListener("add", () => {
        for (const stopId of routeMap.stopIds) {
            if (stopId in stopById) {
                const stopMarker = stopById[stopId].stopMarker;
                stopMarker.options.visibility++;
                stopMarker.addTo(stopLayer);
            }
        }
    });
    
    routeMap.layerGroup.addEventListener("remove", () => {
        for (const stopId of routeMap.stopIds) {
            if (stopId in stopById) {
                const stopMarker = stopById[stopId].stopMarker;
                stopMarker.options.visibility--;
                if (stopMarker.options.visibility == 0) {
                    stopMarker.removeFrom(stopLayer);
                }
            }
        }
    });

    routeMap.layerGroup.addTo(layerGroupByMode[computeMode(routeMap.routeId)]);

    const dummyLayer = L.circleMarker([-37.8, 145], { radius: 0, opacity: 0, title: " " });
    if (["metroTrain", "regionTrain"].includes(computeMode(routeMap.routeId))) {
        dummyLayer.options.title = `${routeMap.routeShortName} line` || " ";
        if (routeMap.routeCode === "vPK") {
            dummyLayer.options.title += " (V/Line)";
        }
    } else if (routeMap.routeShortName) {
        dummyLayer.options.title = `${routeMap.routeShortName} ${routeMap.routeLongName}`;
    }

    dummyLayer.addEventListener("add", () => {
        routeMap.layerGroup.addTo(map);
        map.fitBounds(geojsonLayer.getBounds(), { padding: [100, 100] });
    });
    dummyLayer.addTo(searchLayer);
}

for (const stopMap of stopMaps) {
    let stopIcon = regionTrainStopIcon;
    for (const routeMap of stopMap.routeMaps) {
        switch (computeMode(routeMap.routeId)) {
            case "bus":
                stopIcon = busStopIcon;
                break;
            case "metroTrain":
                stopIcon = metroTrainStopIcon;
                break;
            case "metroTram":
                stopIcon = tramStopIcon;
                break;
        }
    }

    const stopMarker = L.marker(
        [stopMap.stopLat, stopMap.stopLon],
        {
            icon: L.icon({
                iconUrl: stopIcon,
                iconSize: [20, 20]
            }),
            title: stopMap.stopName,
            visibility: 0
        }
    );
    stopMap.stopMarker = stopMarker;

    stopMarker.bindPopup(
        createStopPopup(stopMap, routeMaps, stopById, map),
        { autoPan: false }
    );
    
    stopMarker.addTo(searchLayer);
}

L.control.layers.tree(null, createIndexLayerTree(routeMaps, routeByCode, stopById, vehicleMaps, stopLayer, layerGroupByMode, state), {
    selectorBack: true
}).addTo(map);

const attributionPrefix = document.createElement("span");

const positionStatus = document.createElement("div");
const tripStatus = document.createElement("div");

const clock = document.createElement("div");
setInterval(() => {
    const time = timeString(Math.floor(Date.now()/1000), true);
    clock.textContent = `Current time: ${time}`;
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
}, 1000);

const dtpAttribution = document.createElement("div");

const dtpLink = document.createElement("a");
dtpLink.href = "https://opendata.transport.vic.gov.au/organization/public-transport";
dtpLink.textContent = "DTP";
dtpAttribution.appendChild(dtpLink);

const dtpTime = document.createTextNode("");
dtpAttribution.appendChild(dtpTime);

const leafletAttribution = document.createElement("a");
leafletAttribution.href = "https://leafletjs.com";
leafletAttribution.textContent = "Leaflet";

for (const element of [positionStatus, tripStatus, clock, dtpAttribution, leafletAttribution]) {
    attributionPrefix.appendChild(element);
}


updatePositions(routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map, modes);
updateTrips(routeMaps, routeById, stopMaps, stopById, vehicleByTripId, platformById, tripStatus, attributionPrefix, map, modes);