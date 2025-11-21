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
import { routeMaps, routeById, routeByName } from "./routeMaps.js";
import { stopMaps, stopById, stopByName, platformById } from "./stopMaps.js";
import { vehicleMaps, vehicleByTripId } from "./vehicleMaps.js";
import { timeString } from "./stringConverters.js";
import { createLayerTree } from "./layerTree.js";
import { updatePositions, updateTrips } from "./updateRealtime.js";
import { createStopPopup } from "./stopPopup.js";
import stationIcon from "./station.svg";
import "./style.css";

const state = {
    vehicleMarkerLabelSelection: "route"
}

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

map.createPane("vehiclePane", map.getPane("norotatePane")).style.zIndex = 625;

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
    
    foundMarker = data.layer;
    foundMarker.addTo(map);
    foundMarker.openPopup();
}).addTo(map);
searchLayer.remove();

L.control.layers.tree(null, createLayerTree(routeMaps, routeByName, stopByName, vehicleMaps, stationLayer, state), {
    selectorBack: true
}).addTo(map);

// Reset rotation when controller clicked
map.rotateControl.getContainer().addEventListener("mouseup", () => {
    map.setBearing(0);
    if (!map.touchRotate.enabled()) {
        setTimeout(() => { map.setBearing(0) }, 100);
    }
});

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

for (const stopMap of stopMaps) {
    const stopMarker = L.marker(
        [stopMap.stopLat, stopMap.stopLon],
        {
            icon: L.icon({
                iconUrl: stationIcon,
                iconSize: [20, 20]
            }),
            title: stopMap.stopName,
            visibility: 0
        }
    );

    stopMarker.bindPopup(
        createStopPopup(stopMap, routeMaps, stopByName, map),
        { autoPan: false }
    );
    
    stopMarker.addTo(searchLayer);

    stopMap.stopMarker = stopMarker;
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
            stopMarker.addTo(stationLayer);
        }
    });
    
    routeMap.layerGroup.addEventListener("remove", () => {
        for (const stopName of routeMap.stopNames) {
            const stopMarker = stopByName[stopName].stopMarker;
            stopMarker.options.visibility--;
            if (stopMarker.options.visibility == 0) {
                stopMarker.removeFrom(stationLayer);
            }
        }
    });

    routeMap.layerGroup.addTo(map)
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