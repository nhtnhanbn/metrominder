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
import geojson from "./metro_lines.geojson";
import stopData from "../../data/gtfsschedule/stops.txt";
import { routeMaps, routeById, routeByName } from "./routeMaps.js";
import { vehicleMaps, vehicleByTripId } from "./vehicleMaps.js";
import { timeString, shortName } from "./stringConverters.js";
import stationIcon from "./station.svg";
import { createLayerTree } from "./layerTree.js";
import { updatePositions, updateTrips } from "./updateRealtime.js";
import { createStopPopup } from "./stopPopup.js";
import "./style.css";

const state = {
    vehicleMarkerLabelSelection: "route"
}

class StopMap {
    constructor(stopId, stopName, stopMarker) {
        this.stopId = stopId;
        this.stopName = stopName;
        this.stopMarker = stopMarker;
        this.routeMaps = new Set();
        this.stopDepartures = [];
    }
}
const stopMaps = new Set(), stopById = {}, stopByName = {};

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./serviceWorker.js")
            .then((res) => console.log("serviceWorker.js registered", res))
            .catch((err) => console.log("serviceWorker.js not registered", err))
    })
};

const searchLayer = L.layerGroup();
const stationLayer = L.layerGroup();

const map = L.map("map", {
    zoomControl: false,
    zoomSnap: 0,
    fullscreenControl: true,
    rotate: true,
    rotateControl: { closeOnZeroBearing: false },
    touchRotate: true
}).fitBounds([[-38.4, 145.6], [-37.5, 144.5]]);

L.Control.zoomHome().addTo(map);
L.control.scale().addTo(map);

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

map.createPane("vehiclePane", map.getPane("norotatePane")).style.zIndex = 625;

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

// Open popups on the bottom
map.addEventListener("popupopen", ({popup}) => {
    popup._wrapper.remove();
    popup._container.appendChild(popup._wrapper);
});

// Reset rotation when controller clicked
map.rotateControl.getContainer().addEventListener("mouseup", () => {
    map.setBearing(0);
    if (!map.touchRotate.enabled()) {
        setTimeout(() => { map.setBearing(0) }, 100);
    }
});

var foundMarker;
(new L.Control.Search({
    position: "topright",
    layer: searchLayer,
    zoom: 14,
    delayType: 0,
    firstTipSubmit: true,
    autoResize: false,
    autoCollapse: true,
    textErr: "Station not found.",
    textPlaceholder: "Search stations...",
    marker: false
})).addEventListener("search:locationfound", (data) => {
    if (
        foundMarker &&
        (foundMarker.options.visibility == 0 || !map.hasLayer(stationLayer))
    ) {
        foundMarker.remove();
    }
    foundMarker = data.layer.addTo(map).openPopup();
}).addTo(map);
searchLayer.remove();

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        opacity: 0.5,
        attribution: `&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>`
    }
).addTo(map);



const parentById = {}, platformById = {};
for (const stopDatum of stopData) {
    let { stop_id, stop_name, stop_lat, stop_lon, parent_station, platform_code } = stopDatum;
    
    if (parent_station === "") {
        stop_name = shortName(stop_name);
        
        const stopMarker = L.marker(
            [stop_lat, stop_lon],
            {
                icon: L.icon({
                    iconUrl: stationIcon,
                    iconSize: [20, 20]
                }),
                title: stop_name,
                visibility: 0
            }
        );

        const stopMap = new StopMap(stop_id, stop_name, stopMarker);
        stopMaps.add(stopMap);
        stopById[stop_id] = stopMap;
        stopByName[stop_name] = stopMap;

        stopMarker.bindPopup(
            createStopPopup(stopMap, routeMaps, stopByName, map),
            { autoPan: false }
        ).addTo(searchLayer);
    } else {
        parentById[stop_id] = parent_station;
        platformById[stop_id] = platform_code;
    }
}

for (const routeMap of routeMaps) {
    routeMap.layerGroup = L.layerGroup();
    routeMap.layerGroup.addLayer(
        L.geoJSON(
            geojson.features.filter((feature) => {
                return routeMap.shapeIds.includes(feature.properties.SHAPE_ID);
            }),
            { style: { color: routeMap.routeColour } }
        )
    );
    
    routeMap.layerGroup.addEventListener("add", () => {
        for (const stopName of routeMap.stopNames) {
            const stopMarker = stopByName[stopName].stopMarker;
            stopMarker.options.visibility++;
            stationLayer.addLayer(stopMarker);
        }
    });
    
    routeMap.layerGroup.addEventListener("remove", () => {
        for (const stopName of routeMap.stopNames) {
            const stopMarker = stopByName[stopName].stopMarker;
            stopMarker.options.visibility--;
            if (stopMarker.options.visibility == 0) {
                stationLayer.removeLayer(stopMarker);
            }
        }
    });

    routeMap.layerGroup.addTo(map)
}

for (let [stopId, parentId] of Object.entries(parentById)) {
    while (parentId in parentById) {
        parentId = parentById[parentId];
    }
    stopById[stopId] = stopById[parentId];
}

for (const routeMap of routeMaps) {
    for (const stopName of routeMap.stopNames) {
        stopByName[stopName].routeMaps.add(routeMap);
    }
}

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

updatePositions(routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map);




updateTrips(routeMaps, routeById, stopMaps, stopById, stopByName, vehicleByTripId, platformById, tripStatus, attributionPrefix, map);

L.control.layers.tree(null, createLayerTree(routeMaps, routeByName, stopByName, vehicleMaps, stationLayer, state), {
    selectorBack: true
}).addTo(map);