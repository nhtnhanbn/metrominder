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
import stationLines from "../../data/stationLines.json";
import { routeMaps, routeById, routeByName } from "./routeMaps.js";
import { timeString } from "./timeString.js";
import stationIcon from "./station.svg";
import "./style.css";

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

class VehicleMap {
    constructor(tripId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo) {
        this.tripId = tripId;
        this.routeCode = routeCode;
        this.vehicleModelCode = vehicleModelCode;
        this.vehicleMarker = vehicleMarker;
        this.vehicleLabel = vehicleLabel;
        this.vehicleLabelContent = vehicleLabelContent;
        this.vehicleConsistInfo = vehicleConsistInfo;
    }
}
let vehicleByTripId = {};

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
        setLines(stopName);
        stopMarker.closePopup();
    });
    routesList.appendChild(setButton);
    
    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.addEventListener("click", () => {
        addLines(stopName);
        stopMarker.closePopup();
    });
    routesList.appendChild(addButton);
    
    const filterButton = document.createElement("button");
    filterButton.textContent = "Filter";
    filterButton.addEventListener("click", () => {
        filterLines(stopName);
        stopMarker.closePopup();
    });
    routesList.appendChild(filterButton);
    
    stopPopup.appendChild(routesList);
    
    return stopPopup;
}

function setLines(stopName) {
    for (const routeMap of routeMaps) {
        routeMap.layerGroup.remove();
    }

    for (const routeMap of stopByName[stopName].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function addLines(stopName) {
    for (const routeMap of stopByName[stopName].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function filterLines(stopName) {
    for (const routeMap of routeMaps) {
        if (!stopByName[stopName].routeMaps.has(routeMap)) {
            routeMap.layerGroup.remove();
        }
    }
}

for (const routeMap of routeMaps) {
    routeMap.line = L.geoJSON(
        geojson.features.filter((feature) => {
            return routeMap.shapeIds.includes(feature.properties.SHAPE_ID);
        }),
        { style: { color: routeMap.routeColour } }
    );
    routeMap.layerGroup = L.layerGroup();
    routeMap.layerGroup.addLayer(routeMap.line);
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

for (let [stopId, parentId] of Object.entries(parentById)) {
    while (parentId in parentById) {
        parentId = parentById[parentId];
    }
    stopById[stopId] = stopById[parentId];
}

for (const [routeName, stationLine] of Object.entries(stationLines)) {
    for (const stopName of stationLine) {
        stopByName[stopName].routeMaps.add(routeByName[routeName]);
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

async function updatePositions() {
    positionStatus.textContent = "Retrieving positions...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const response = await fetch("https://api.metrominder.nhan.au/positions");
        const feed = await response.json();
        
        const updatedVehicleByTripId = {};
        for (const vehicle of feed.feed.entity) {
            const { latitude, longitude, bearing } = vehicle.vehicle.position;
            const tripId = vehicle.vehicle.trip.tripId;
            const routeId = vehicle.vehicle.trip.routeId;
            const routeCode = routeId.slice(15, 18);
            const vehiclePopup = `Position at ${timeString(vehicle.vehicle.timestamp, true)}`;
            
            if (tripId in vehicleByTripId) {
                vehicleByTripId[tripId].vehicleMarker.setRotation(bearing)
                                                     .slideTo([latitude, longitude]);
                vehicleByTripId[tripId].vehicleLabel.setTooltipContent(vehiclePopup)
                                                    .slideTo([latitude, longitude]);
                updatedVehicleByTripId[tripId] = vehicleByTripId[tripId];
            } else {
                const consist = vehicle.vehicle.vehicle.id;
                const splitConsist = consist.split("-");
                let carCode = splitConsist.find((car) => {
                    return car[car.length-1] === 'T';
                });
                
                let carCount, vehicleModelName, vehicleModelCode = "";
                if (carCode) {
                    carCount = splitConsist.length;
                    
                    const carNumber = parseInt(carCode.slice(0, -1));
                    if (1000 <= carNumber && carNumber < 1200) {
                        vehicleModelName = "Comeng";
                        vehicleModelCode = "COM";
                    } else if (2500 <= carNumber && carNumber < 2600) {
                        vehicleModelName = "Siemens";
                        vehicleModelCode = "SIE";
                    } else if (1300 <= carNumber && carNumber < 1700) {
                        vehicleModelName = "X'Trapolis 100";
                        vehicleModelCode = "XT1";
                    } else if (8100 <= carNumber && carNumber < 8900) {
                        vehicleModelName = "X'Trapolis 2.0";
                        vehicleModelCode = "XT2";
                    }
                } else if (splitConsist.length > 0) {
                    carCode = splitConsist[0];

                    const carNumber = parseInt(carCode.slice(0, -1));
                    if (9000 <= carNumber && carNumber < 10000) {
                        carCount = 7;
                        vehicleModelName = "High Capacity Metro Train";
                        vehicleModelCode = "HCM";
                    } else if (7000 <= carNumber && carNumber < 7030) {
                        carCount = 1;
                        vehicleModelName = "Sprinter";
                        vehicleModelCode = "SPR";
                    }
                }
                
                if ((!carCount || !vehicleModelName) && routeId === "aus:vic:vic-02-STY:") {
                    carCount = 1;
                    vehicleModelName = "Sprinter";
                    vehicleModelCode = "SPR";
                }
                
                let vehicleConsistInfo = `<p style="margin-bottom: 0">
                                       <b>`;
                
                if (carCount) {
                    vehicleConsistInfo += `${carCount}-car`;
                }
                
                if (vehicleModelName) {
                    vehicleConsistInfo += ` ${vehicleModelName}`;
                }
                
                vehicleConsistInfo += `</b>
                            </p>
                            <p style="margin-top: 0">
                                ${consist}
                            </p>`;
                
                const vehicleLabelContent = document.createElement("div");
                if (vehicleMarkerLabelSelection === "route") {
                    vehicleLabelContent.textContent = routeCode;
                } else {
                    vehicleLabelContent.textContent = vehicleModelCode;
                }
                vehicleLabelContent.style.color = routeById[routeId].routeTextColour;
                                 
                const vehicleMarker = L.marker.arrowCircle(
                    [latitude, longitude],
                    {
                        iconOptions: {
                            stroke: routeById[routeId].routeTextColour,
                            color: routeById[routeId].routeColour,
                            size: 40,
                            rotation: bearing
                        },
                        pane: "vehiclePane",
                        interactive: false,
                        rotateWithView: true
                    }
                );
                
                const vehicleLabel = L.marker(
                    [latitude, longitude],
                    {
                        icon: L.divIcon({
                            html: vehicleLabelContent,
                            tooltipAnchor: [9, 0],
                            className: "vehicle-label"
                        }),
                        pane: "vehiclePane"
                    }
                ).bindTooltip(
                    L.tooltip().setContent(vehiclePopup)
                ).bindPopup(
                    vehicleConsistInfo + "No trip information.",
                    { autoPan: false }
                );
                
                updatedVehicleByTripId[tripId] = new VehicleMap(tripId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo);
                
                routeById[routeId].layerGroup.addLayer(vehicleMarker).addLayer(vehicleLabel);
            }
        }
        
        for (const tripId in vehicleByTripId) {
            if (!(tripId in updatedVehicleByTripId)) {
                vehicleByTripId[tripId].vehicleMarker.remove();
                vehicleByTripId[tripId].vehicleLabel.remove();
            }
        }
        vehicleByTripId = updatedVehicleByTripId;
        
        const time = timeString(feed.timestamp/1000, true);
        dtpTime.textContent = ` last updated ${time}`;
        positionStatus.textContent = "";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    } catch (error) {
        console.log(error);
        
        positionStatus.textContent = "Failed to retrieve positions.";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    }
    
    setTimeout(updatePositions, 1000);
}
updatePositions();

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
        
        const time = timeString(feed.feed.header.timestamp, true);
        for (const trip of feed.feed.entity) {
            const tripUpdate = trip.tripUpdate;
            const tripId = tripUpdate.trip.tripId;
            if (tripUpdate.trip.scheduleRelationship !== "CANCELED" &&
                "stopTimeUpdate" in tripUpdate) {
                    const routeId = tripUpdate.trip.routeId;
                    const stopTimeUpdate = tripUpdate.stopTimeUpdate;
                    const lastStop = stopTimeUpdate[stopTimeUpdate.length-1];
                    const lastStopName = shortName(stopById[lastStop.stopId].stopName);
                    let popup = `<h3 style="background-color: ${routeById[routeId].routeColour}; color: ${routeById[routeId].routeTextColour};">
                                     SERVICE TO ${lastStopName.toUpperCase()}
                                 </h3>`;
                    
                    if (tripId in vehicleByTripId) {
                        popup += vehicleByTripId[tripId].vehicleConsistInfo;
                    }
                    
                    let future = false;
                    for (const stop of stopTimeUpdate) {
                        const stopMap = stopById[stop.stopId];
                        const platform = platformById[stop.stopId];
                        
                        if (stop.departure && stop.departure.time >= Math.floor(Date.now()/1000)) {
                            stopMap.stopDepartures.push({
                                routeId: routeId,
                                lastStopName: lastStopName,
                                platform: platform,
                                time: stop.departure.time
                            });
                        }
                        
                        if (tripId in vehicleByTripId && stop.arrival) {
                            const stopName = shortName(stopMap.stopName);
                            const stopTime = timeString(stop.arrival.time);
                            
                            if (future) {
                                popup += `<tr>
                                              <td style="text-align: left;">${stopName}</td>
                                              <td>${platform}</td>
                                              <td>${stopTime}</td>
                                          </tr>`;
                            } else if (stop.arrival.time >= Math.floor(Date.now()/1000)) {
                                popup += `<table>
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
                    popup += `</table>
                              <p>Trip update ${time}</p>`;
                    
                    if (tripId in vehicleByTripId) {
                        vehicleByTripId[tripId].vehicleLabel.setPopupContent(popup);
                    }
            }
        }
        
        for (const stopMap of stopMaps) {
            const stationName = stopMap.stopName, stationMarker = stopMap.stopMarker;
            let popup = createStopPopup(stationMarker);
            
            const stationDepartures = stopMap.stopDepartures;
            if (stationDepartures.length > 0) {
                stationDepartures.sort((a, b) => {
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
                
                for (const departure of stationDepartures) {
                    const row = document.createElement("tr");
                    
                    const serviceCell = document.createElement("td");
                    serviceCell.textContent = departure.lastStopName;
                    serviceCell.style.backgroundColor = routeById[departure.routeId].routeColour;
                    serviceCell.style.color = routeById[departure.routeId].routeTextColour;
                    row.appendChild(serviceCell);
                    
                    for (const column of [
                        departure.platform,
                        timeString(departure.time)
                    ]) {
                        const cell = document.createElement("td");
                        cell.textContent = column;
                        row.appendChild(cell);
                    }
                    
                    table.appendChild(row);
                }
                popup.appendChild(table);
            } else {
                const text = document.createElement("div");
                text.textContent = "No departing trains.";
                popup.appendChild(text);
            }
            
            const updateTime = document.createElement("p");
            updateTime.textContent = `Trip updates ${time}`;
            popup.appendChild(updateTime);
            
            stationMarker.setPopupContent(popup);
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

const layerTrees = {};
for (const [routeName, routeMap] of Object.entries(routeByName)) {
    routeMap.layerGroup.addEventListener("add", () => {
        for (const stopName of stationLines[routeName]) {
            const station = stopByName[stopName].stopMarker;
            station.options.visibility++;
            stationLayer.addLayer(station);
        }
    });
    
    routeMap.layerGroup.addEventListener("remove", () => {
        for (const stopName of stationLines[routeName]) {
            const station = stopByName[stopName].stopMarker;
            station.options.visibility--;
            if (station.options.visibility == 0) {
                stationLayer.removeLayer(station);
            }
        }
    });

    routeMap.layerGroup.addTo(map)
    
    layerTrees[routeName] = {
        label: `<span style="background-color: ${routeMap.routeColour}; color: ${routeMap.routeTextColour};">
                    ${routeName} line&nbsp
                </span>`,
        layer: routeMap.layerGroup
    };
}

L.control.layers.tree(null, [
    {
        label: "Train marker labels",
        children: [
            {
                label: `<label title="Label train markers with line code">
                            <input class="marker-radio" type="radio" name="labels" value="route">
                            Line
                        </label>`,
                eventedClasses: [{
                    className: "marker-radio",
                    event: "change",
                    selectAll: (ev, domNode, treeNode, map) => {
                        vehicleMarkerLabelSelection = "route";
                        for (const train of Object.values(vehicleByTripId)) {
                            train.vehicleLabelContent.textContent = train.routeCode;
                        }
                    }
                }]
            },
            {
                label: `<label title="Label train markers with type code">
                            <input class="marker-radio" type="radio" name="labels" value="type">
                            Type
                        </label>`,
                eventedClasses: [{
                    className: "marker-radio",
                    event: "change",
                    selectAll: (ev, domNode, treeNode, map) => {
                        vehicleMarkerLabelSelection = "type";
                        for (const train of Object.values(vehicleByTripId)) {
                            train.vehicleLabelContent.textContent = train.vehicleModelCode;
                        }
                    }
                }]
            }
        ]
    },
    {
        label: "Show stations",
        layer: stationLayer
    },
    {
        label: `<div class="leaflet-control-layers-separator"></div>`
    },
    {
        label: "<b>All lines<b>",
        selectAllCheckbox: true,
        children: [
            layerTrees["Sandringham"],
            {
                label: `<span style="background-color: #279FD5; color: black;">
                            Caulfield group
                        <span>
                        &nbsp`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerTrees["Cranbourne"],
                    layerTrees["Pakenham"]
                ]
            },
            {
                label: `<span style="background-color: #BE1014; color: white;">
                            Clifton Hill group
                        </span>
                        &nbsp`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerTrees["Hurstbridge"],
                    layerTrees["Mernda"]
                ]
            },
            {
                label: `<span style="background-color: #FFBE00; color: black;">
                            Northern group
                        </span>
                        &nbsp`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerTrees["Craigieburn"],
                    layerTrees["Sunbury"],
                    layerTrees["Upfield"]
                ]
            },
            {
                label: `<span style="background-color: #028430; color: white;">
                            Cross-city group
                        </span>
                        &nbsp`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    {
                        label: `<span style="background-color: #028430; color: white;">
                                    Frankston
                                </span>
                                &nbsp`,
                        selectAllCheckbox: true,
                        children: [
                            layerTrees["Frankston"],
                            layerTrees["Stony Point"]
                        ]
                    },
                    {
                        label: `<span style="background-color: #028430; color: white;">
                                    West
                                </span>
                                &nbsp`,
                        selectAllCheckbox: true,
                        children: [
                            layerTrees["Werribee"],
                            layerTrees["Williamstown"]
                        ]
                    }
                ]
            },
            {
                label: `<span style="background-color: #152C6B; color: white;">
                            Burnley group
                        </span>
                        &nbsp`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerTrees["Glen Waverley"],
                    {
                        label: `<span style="background-color: #152C6B; color: white;">
                                    Camberwell
                                </span>
                                &nbsp`,
                        selectAllCheckbox: true,
                        children: [
                            layerTrees["Alamein"],
                            {
                                label: `<span style="background-color: #152C6B; color: white;">
                                            Ringwood
                                        </span>
                                        &nbsp`,
                                selectAllCheckbox: true,
                                children: [
                                    layerTrees["Belgrave"],
                                    layerTrees["Lilydale"]
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                label: "Special services",
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerTrees["Flemington Racecourse"],
                    layerTrees["City Circle"]
                ]
            }
        ]
    },
    {
        label: "<b>Presets<b>",
        children: [
            {
                label: `<button class="preset-button" title="Burnley, Clifton Hill, Caulfield and Northern groups and City Circle line" style="background: linear-gradient(to right, #152C6B 25%, #BE1014 25% 50%, #279FD5 50% 75%, #FFBE00 75%);">
                            City Loop
                        </button>`,
                eventedClasses: [{
                    className: "preset-button",
                    event: "click",
                    selectAll: (ev, domNode, treeNode, map) => {
                        setLines("Melbourne Central");
                        routeByName["Flemington Racecourse"].layerGroup.remove();
                    }
                }]
            },
            {
                label: `<button class="preset-button" title="Burnley, Cross-city (except Stony Point line) and Caulfield groups and Sandringham line" style="background: linear-gradient(to right, #152C6B 25%, #028430 25% 50%, #279FD5 50% 75%, #F178AF 75%);">
                            Richmond
                        </button>`,
                eventedClasses: [{
                    className: "preset-button",
                    event: "click",
                    selectAll: (ev, domNode, treeNode, map) => {
                        setLines("Richmond");
                        routeByName["Werribee"].layerGroup.addTo(map);
                        routeByName["Williamstown"].layerGroup.addTo(map);
                    }
                }]
            },
            {
                label: `<button class="preset-button" title="Cross-city (except Stony Point line) and Caulfield groups and Sandringham line" style="background: linear-gradient(to right, #028430 25%, #279FD5 25% 75%, #F178AF 75%);">
                            South Yarra
                        </button>`,
                eventedClasses: [{
                    className: "preset-button",
                    event: "click",
                    selectAll: (ev, domNode, treeNode, map) => {
                        setLines("South Yarra");
                        routeByName["Werribee"].layerGroup.addTo(map);
                        routeByName["Williamstown"].layerGroup.addTo(map);
                    }
                }]
            },
            {
                label: `<button class="preset-button" title="Cross-city (except Stony Point line) and Caulfield groups" style="background: linear-gradient(to right, #028430 50%, #279FD5 50%);">
                            Caulfield
                        </button>`,
                eventedClasses: [{
                    className: "preset-button",
                    event: "click",
                    selectAll: (ev, domNode, treeNode, map) => {
                        setLines("Caulfield");
                        routeByName["Werribee"].layerGroup.addTo(map);
                        routeByName["Williamstown"].layerGroup.addTo(map);
                    }
                }]
            },
            {
                label: `<button class="preset-button" title="Cross-city (except Stony Point line) and Northern groups" style="background: linear-gradient(to right, #028430 50%, #FFBE00 50%);">
                            North Melbourne
                        </button>`,
                eventedClasses: [{
                    className: "preset-button",
                    event: "click",
                    selectAll: (ev, domNode, treeNode, map) => {
                        setLines("North Melbourne");
                        routeByName["Frankston"].layerGroup.addTo(map);
                        routeByName["Flemington Racecourse"].layerGroup.remove();
                    }
                }]
            },
            {
                label: `<button class="preset-button" title="Cross-city (except Stony Point line) group and Sunbury line" style="background: linear-gradient(to right, #028430 75%, #FFBE00 25%);">
                            Footscray
                        </button>`,
                eventedClasses: [{
                    className: "preset-button",
                    event: "click",
                    selectAll: (ev, domNode, treeNode, map) => {
                        setLines("Footscray");
                        routeByName["Frankston"].layerGroup.addTo(map);
                    }
                }]
            }
        ]
    }
], {
    selectorBack: true
}).addTo(map);

let vehicleMarkerLabelSelection = "route";
setInterval(() => {
    document.querySelector(
        `input[name=labels][value=${vehicleMarkerLabelSelection}]`
    ).checked = true;
}, 0);
