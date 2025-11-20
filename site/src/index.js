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
import { timeString } from "./timeString.js";
import stationIcon from "./station.svg";
import { createLayerTree } from "./layerTree.js";
import { setLines, addLines, filterLines } from "./lineFilters.js";
import { updatePositions } from "./updateRealtime.js";
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

function createStopPopup(stopMarker) {
    const stopName = stopMarker.options.title;

    const stopPopup = document.createElement("div");
    stopPopup.style.textAlign = "center";
    
    const header = document.createElement("h3");
    header.textContent = stopName;
    stopPopup.appendChild(header);
    
    const routesHeading = document.createElement("h4");
    routesHeading.textContent = "Lines";
    stopPopup.appendChild(routesHeading);
    
    const routesList = document.createElement("p");
    routesList.style.marginTop = 0;
    
    for (const routeMap of stopByName[stopName].routeMaps) {
        const routeItem = document.createElement("span");
        routeItem.textContent = routeMap.routeName;
        routeItem.style.backgroundColor = routeMap.routeColour;
        routeItem.style.color = routeMap.routeTextColour;
        routeItem.style.whiteSpace = "nowrap";
        routesList.appendChild(routeItem);
        
        routesList.appendChild(document.createTextNode(" "));
    }
    routesList.appendChild(document.createElement("br"));
    
    const setButton = document.createElement("button");
    setButton.textContent = "Set";
    setButton.addEventListener("click", () => {
        setLines(stopName, stopByName, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(setButton);
    
    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.addEventListener("click", () => {
        addLines(stopName, stopByName, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(addButton);
    
    const filterButton = document.createElement("button");
    filterButton.textContent = "Filter";
    filterButton.addEventListener("click", () => {
        filterLines(stopName, stopByName, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(filterButton);
    
    stopPopup.appendChild(routesList);
    
    return stopPopup;
}

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
            createStopPopup(stopMarker),
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

function shortName(stopName) {
    let sliceEnd = stopName.indexOf(" Railway Station");
    if (sliceEnd < 0) {
        sliceEnd = stopName.length;
    }

    return stopName.slice(0, sliceEnd)
                   .replace("Station", "")
                   .replace("Railway", "")
                   .replace("Rail Replacement Bus Stop", "")
                   .trim();
}

async function updateTrips() {
    tripStatus.textContent = "Retrieving trip updates...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const response = await fetch("https://api.metrominder.nhan.au/trips");
        const feed = await response.json();
        
        for (const stopMap of stopMaps) {
            stopMap.stopDepartures = [];
        }
        
        const tripUpdateTime = timeString(feed.feed.header.timestamp, true);
        for (const trip of feed.feed.entity) {
            const tripUpdate = trip.tripUpdate;
            const tripId = tripUpdate.trip.tripId;
            if (tripUpdate.trip.scheduleRelationship !== "CANCELED" && "stopTimeUpdate" in tripUpdate) {
                const routeId = tripUpdate.trip.routeId;
                const stopTimeUpdate = tripUpdate.stopTimeUpdate;
                const lastStop = stopTimeUpdate[stopTimeUpdate.length-1];
                const lastStopName = shortName(stopById[lastStop.stopId].stopName);
                let vehiclePopup = `<h3 style="background-color: ${routeById[routeId].routeColour}; color: ${routeById[routeId].routeTextColour};">
                                        Service to ${lastStopName}
                                    </h3>`;
                
                if (tripId in vehicleByTripId) {
                    vehiclePopup += vehicleByTripId[tripId].vehicleConsistInfo;
                }
                
                let future = false;
                for (const stop of stopTimeUpdate) {
                    const stopMap = stopById[stop.stopId];
                    const platform = platformById[stop.stopId];
                    
                    if (stop.departure && stop.departure.time >= Math.floor(Date.now()/1000)) {
                        stopMap.stopDepartures.push({
                            routeMap: routeById[routeId],
                            lastStopName: lastStopName,
                            platform: platform,
                            time: stop.departure.time
                        });
                    }
                    
                    if (tripId in vehicleByTripId && stop.arrival) {
                        const stopName = shortName(stopMap.stopName);
                        const stopTime = timeString(stop.arrival.time);
                        
                        if (future) {
                            vehiclePopup += `<tr>
                                                 <td style="text-align: left;">${stopName}</td>
                                                 <td>${platform}</td>
                                                 <td>${stopTime}</td>
                                             </tr>`;
                        } else if (stop.arrival.time >= Math.floor(Date.now()/1000)) {
                            vehiclePopup += `<table>
                                                 <tr>
                                                     <th style="text-align: left;">ARRIVING AT</td>
                                                     <th>PLATFORM</td>
                                                     <th>TIME</td>
                                                 </tr>
                                                 <tr>
                                                     <th style="text-align: left;">${stopName}</td>
                                                     <th>${platform}</td>
                                                     <th>${stopTime}</td>
                                                 </tr>`;
                            future = true;
                        }
                    }
                }
                vehiclePopup += `</table> <p>Trip update ${tripUpdateTime}</p>`;
                
                if (tripId in vehicleByTripId) {
                    vehicleByTripId[tripId].vehicleLabel.setPopupContent(vehiclePopup);
                }
            }
        }
        
        for (const stopMap of stopMaps) {
            const stopMarker = stopMap.stopMarker;
            const stopPopup = createStopPopup(stopMarker);
            
            const stopDepartures = stopMap.stopDepartures;
            if (stopDepartures.length > 0) {
                stopDepartures.sort((a, b) => {
                    return parseInt(a.time) - parseInt(b.time);
                });
                
                const table = document.createElement("table");
                
                const header = document.createElement("tr");
                for (const column of ["DEPARTING FOR", "PLATFORM", "TIME"]) {
                    const cell = document.createElement("th");
                    cell.textContent = column;
                    header.appendChild(cell);
                }
                table.appendChild(header);
                
                for (const stopDeparture of stopDepartures) {
                    const row = document.createElement("tr");
                    
                    const serviceCell = document.createElement("td");
                    serviceCell.textContent = stopDeparture.lastStopName;
                    serviceCell.style.backgroundColor = stopDeparture.routeMap.routeColour;
                    serviceCell.style.color = stopDeparture.routeMap.routeTextColour;
                    row.appendChild(serviceCell);
                    
                    for (const column of [
                        stopDeparture.platform,
                        timeString(stopDeparture.time)
                    ]) {
                        const cell = document.createElement("td");
                        cell.textContent = column;
                        row.appendChild(cell);
                    }
                    
                    table.appendChild(row);
                }
                stopPopup.appendChild(table);
            } else {
                const text = document.createElement("div");
                text.textContent = "No departing trains.";
                stopPopup.appendChild(text);
            }
            
            const updateTime = document.createElement("p");
            updateTime.textContent = `Trip updates ${tripUpdateTime}`;
            stopPopup.appendChild(updateTime);
            
            stopMarker.setPopupContent(stopPopup);
        }
        
        tripStatus.textContent = "";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    } catch (error) {
        console.log(error);
        
        tripStatus.textContent = "Failed to retrieve trip updates.";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    }
    
    setTimeout(updateTrips, 1000);
};
updateTrips();

L.control.layers.tree(null, createLayerTree(routeMaps, routeByName, stopByName, vehicleMaps, stationLayer, state), {
    selectorBack: true
}).addTo(map);