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
import metroTrainGeojson from "../../data/metroTrainRoutes.geojson";
import regionTrainGeojson from "../../data/regionTrainRoutes.geojson";
import metroTrainStopData from "../../data/gtfsschedule/2/stops.txt";
import regionTrainStopData from "../../data/gtfsschedule/1/stops.txt";
import { createRouteStructures } from "./modules/setup/routeMaps.js";
import { createStopStructures } from "./modules/setup/stopMaps.js";
import { vehicleMaps, vehicleByTripId } from "./modules/setup/vehicleMaps.js";
import { timeString } from "./modules/stringConverters.js";
import { createTrainLayerTree } from "./modules/layerTrees/trainLayerTree.js";
import { updatePositions, updateTrips } from "./modules/updateRealtime.js";
import { createStopPopup } from "./modules/stopPopup.js";
import { LControlWatermark, LControlInfo, LControlOmni, LControlTram } from "./modules/leafletControls.js";
import metroTrainStopIcon from "./static/PICTO_MODE_Train.svg";
import regionTrainStopIcon from "./static/PICTO_MODE_RegionalTrain.svg";
import "./style.css";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/serviceWorker.js")
            .then((res) => console.log("serviceWorker.js registered", res))
            .catch((err) => console.log("serviceWorker.js not registered", err))
    })
};

const modes = ["metroTrain", "regionTrain"];
const { routeMaps, routeById } = createRouteStructures(modes, {
    metroTrainGeojson: metroTrainGeojson,
    regionTrainGeojson: regionTrainGeojson
});
const { stopMaps, stopById, stopByName, platformById } = createStopStructures(modes, routeMaps, {
    metroTrainStopData: metroTrainStopData,
    regionTrainStopData: regionTrainStopData
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

(new LControlWatermark({
    position: "topright"
})).addTo(map);

(new LControlInfo({
    position: "topright"
})).addTo(map);

(new LControlTram({
    position: "topright"
})).addTo(map);

(new LControlOmni({
    position: "topright"
})).addTo(map);

let foundMarker;
(new L.Control.Search({
    position: "topright",
    layer: searchLayer,
    zoom: 14,
    delayType: 0,
    firstTipSubmit: true,
    autoResize: false,
    autoCollapse: true,
    autoCollapseTime: 1e9,
    textErr: "Station not found.",
    textPlaceholder: "Search stations...",
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

for (const stopMap of stopMaps) {
    let stopIcon = regionTrainStopIcon;
    for (const routeMap of stopMap.routeMaps) {
        if (routeMap.routeId[13] === '2') {
            stopIcon = metroTrainStopIcon;
        }
    }

    const stopMarker = L.marker(
        [stopMap.stopLat, stopMap.stopLon],
        {
            icon: L.icon({
                iconUrl: stopIcon,
                iconSize: [18, 18]
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

for (const routeMap of routeMaps) {
    routeMap.layerGroup = L.layerGroup();
    L.geoJSON(
        routeMap.geojson,
        {
            style: { color: routeMap.routeColour },
            pane: routeMap.routeId[13] === '2' ? "metroRoutePane": "regionRoutePane"
        }
    ).addTo(routeMap.layerGroup);
    
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

    routeMap.layerGroup.addTo(map);
}

L.control.layers.tree(null, createTrainLayerTree(routeMaps, routeById, stopById, vehicleMaps, stopLayer, state), {
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


updatePositions(routeMaps, routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map);
updateTrips(routeMaps, routeById, stopMaps, stopById, vehicleByTripId, platformById, tripStatus, attributionPrefix, map);