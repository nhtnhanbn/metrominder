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
import metroTramGeojson from "../../data/metroTramRoutes.geojson";
import regionTrainGeojson from "../../data/regionTrainRoutes.geojson";
import metroTrainStopData from "../../data/gtfsschedule/2/stops.txt";
import metroTramStopData from "../../data/gtfsschedule/3/stops.txt";
import regionTrainStopData from "../../data/gtfsschedule/1/stops.txt";
import busStopData from "../../data/gtfsschedule/4/stops.txt";
import { createRouteStructures } from "./modules/setup/routeMaps.js";
import { createStopStructures } from "./modules/setup/stopMaps.js";
import { vehicleMaps, vehicleByTripId } from "./modules/setup/vehicleMaps.js";
import { timeString } from "./modules/stringConverters.js";
import { createIndexLayerTree } from "./modules/layerTrees/indexLayerTree.js";
import { updatePositions, updateTrips } from "./modules/updateRealtime.js";
import { createStopPopup } from "./modules/stopPopup.js";
import { LControlWatermark, LControlInfo, LControlTrain, LControlTram } from "./modules/leafletControls.js";
import { addRoutes } from "./modules/routeFilters.js";
import { storageAvailable } from "./modules/webStorage.js";
import metroTrainStopIcon from "./static/PICTO_MODE_Train.svg";
import regionTrainStopIcon from "./static/PICTO_MODE_RegionalTrain.svg";
import tramStopIcon from "./static/PICTO_MODE_Tram.svg";
import busStopIcon from "./static/PICTO_MODE_Bus.svg";
import "./style.css";

function addGeoJSONLayer(routeMap) {
    routeMap.geojsonLayer = L.geoJSON(
        routeMap.geojson,
        {
            style: { color: routeMap.routeColour },
            pane: routeMap.mode === "metroTrain" ? "metroRoutePane": "regionRoutePane"
        }
    );
    routeMap.geojsonLayer.addTo(routeMap.layerGroup);
}

async function addGeoJSON(routeMaps) {
    const params = new URLSearchParams();
    for (const routeMap of routeMaps) {
        params.append(routeMap.mode, routeMap.routeCode);
    }

    const response = await fetch(`${process.env.APIURL}/geojson?${params}`);
    const data = await response.json();

    for (const routeMap of routeMaps) {
        routeMap.geojson = data[routeMap.mode][routeMap.routeCode];
        addGeoJSONLayer(routeMap);
    }
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/serviceWorker.js")
            .then((res) => console.log("serviceWorker.js registered", res))
            .catch((err) => console.log("serviceWorker.js not registered", err))
    })
};

const modes = ["metroTrain", "regionTrain", "metroTram", "bus"]; // in order of decreasing priority
const { routeMaps, routeById } = createRouteStructures(modes, {
    metroTrainGeojson: metroTrainGeojson,
    metroTramGeojson: metroTramGeojson,
    regionTrainGeojson: regionTrainGeojson,
    busGeojson: { features: [] }
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
map.createPane("stationPane", map.getPane("markerPane")).style.zIndex = 620;
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

(new LControlTrain({
    position: "topright"
})).addTo(map);

let foundMarker;
(new L.Control.Search({
    position: "topright",
    layer: searchLayer,
    moveToLocation: (latlng, title, map) => {},
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

    if ("routeMap" in foundMarker.options) {
        const routeMap = foundMarker.options.routeMap;
        addGeoJSON([routeMap]).then(() => {
            map.fitBounds(routeMap.geojsonLayer.getBounds(), { padding: [100, 100] });
        });
        foundMarker.remove();
        routeMap.layerGroup.addTo(map);
    } else {
        map.setView(foundMarker.getLatLng(), 14);
    }
}).addTo(map);
searchLayer.remove();

const layerGroupByMode = {
    metroTrain: L.layerGroup(),
    regionTrain: L.layerGroup(),
    metroTram: L.layerGroup(),
    bus: L.layerGroup()
};

const visibleRouteIds = new Set();
for (const routeMap of routeMaps) {
    routeMap.layerGroup = L.layerGroup();

    routeMap.layerGroup.addEventListener("add", () => {
        if (routeMap.geojson.length === 0) {
            addGeoJSON([routeMap]);
        }

        for (const stopId of routeMap.stopIds) {
            if (stopId in stopById) {
                const stopMarker = stopById[stopId].stopMarker;
                stopMarker.options.visibility++;
                stopMarker.addTo(stopLayer);
            }
        }

        visibleRouteIds.add(routeMap.routeId);
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

        visibleRouteIds.delete(routeMap.routeId);
    });

    routeMap.layerGroup.addTo(layerGroupByMode[routeMap.mode]);
    addGeoJSONLayer(routeMap);

    const dummyLayer = L.circleMarker(
        [0, 0],
        {
            radius: 0,
            opacity: 0,
            title: " ",
            routeMap: routeMap
        }
    );

    if (["metroTrain", "regionTrain"].includes(routeMap.mode)) {
        dummyLayer.options.title = `${routeMap.routeShortName} line` || " ";
        if (routeMap.routeCode === "vPK") {
            dummyLayer.options.title += " (V/Line)";
        }
    } else if (routeMap.routeShortName) {
        dummyLayer.options.title = `${routeMap.routeShortName} ${routeMap.routeLongName}`;
    }

    dummyLayer.addTo(searchLayer);
}

for (const stopMap of stopMaps) {
    let stopIcon;
    for (const routeMap of Array.from(stopMap.routeMaps).toReversed()) {
        switch (routeMap.mode) {
            case "bus":
                stopIcon = busStopIcon;
                break;
            case "metroTrain":
                stopIcon = metroTrainStopIcon;
                break;
            case "regionTrain":
                stopIcon = regionTrainStopIcon;
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
                iconSize: [18, 18]
            }),
            title: stopMap.stopName,
            visibility: 0,
            pane: stopMap.isStation() ? "stationPane" : "markerPane"
        }
    );
    stopMap.stopMarker = stopMarker;

    stopMarker.bindPopup(
        createStopPopup(stopMap, routeMaps, stopById, map),
        { autoPan: false }
    );
    
    stopMarker.addTo(searchLayer);
}

L.control.layers.tree(null, createIndexLayerTree(routeMaps, routeById, stopById, vehicleMaps, stopLayer, layerGroupByMode, state), {
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
setInterval(() => {
    updatePositions(routeMaps, routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map);
}, 1000);

setInterval(() => {
    updateTrips(routeMaps, routeById, stopMaps, stopById, vehicleByTripId, platformById, tripStatus, attributionPrefix, map);
}, 1000);

function setDefaultRoutes() {
    addRoutes("19809", stopById, routeMaps, map);
    addRoutes("22446", stopById, routeMaps, map);
    addRoutes("vic:rail:DNG", stopById, routeMaps, map);
    addRoutes("vic:rail:THL", stopById, routeMaps, map);
    routeById["aus:vic:vic-03-75:"].layerGroup.addTo(map);
    routeById["aus:vic:vic-03-86:"].layerGroup.addTo(map);
    routeById["G01"].layerGroup.addTo(map);
}

if (storageAvailable("sessionStorage")) {
    if (sessionStorage.getItem("indexVisibleRouteIds")) {
        for (const routeId of JSON.parse(sessionStorage.getItem("indexVisibleRouteIds"))) {
            routeById[routeId].layerGroup.addTo(map);
        }
    } else {
        setDefaultRoutes();
    }

    if (sessionStorage.getItem("indexState")) {
        for (const [key, value] of Object.entries(JSON.parse(sessionStorage.getItem("indexState")))) {
            state[key] = value;
        }
    }

    if (sessionStorage.getItem("indexShowStops") && JSON.parse(sessionStorage.getItem("indexShowStops"))) {
        stopLayer.addTo(map);
    }

    setInterval(() => {
        sessionStorage.setItem("indexVisibleRouteIds", JSON.stringify([...visibleRouteIds]));
        sessionStorage.setItem("indexState", JSON.stringify(state));
        sessionStorage.setItem("indexShowStops", JSON.stringify(map.hasLayer(stopLayer)));
    }, 1000);
} else {
    setDefaultRoutes();
}