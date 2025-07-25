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
import stops from "../../data/gtfsschedule/stops.txt";
import routes from "../../data/gtfsschedule/routes.txt";
import stationLines from "../../data/stationLines.json";
import { routeMaps } from "./routeMaps.js";
import { timeString } from "./timeString.js";
import stationIcon from "./station.svg";
import "./style.css";

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

map.createPane("trainPane", map.getPane("norotatePane")).style.zIndex = 625;

(new (L.Control.extend({
    onAdd: (map) => {
        const title = L.DomUtil.create("a");
        title.title = "About MetroMinder";
        
        const metro = L.DomUtil.create("span", "watermark", title);
        metro.style.fontWeight = 1;
        metro.textContent = "METRO";
        const minder = L.DomUtil.create("span", "watermark", title);
        minder.style.fontWeight = 1000;
        minder.textContent = "MINDER";
        
        const about = document.querySelector("dialog");
        title.addEventListener("click", () => {
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
    if (foundMarker &&
        (foundMarker.options.visibility == 0 || !map.hasLayer(stationLayer))) {
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

function stationHeader(marker) {
    const stopName = marker.options.title;
    const popup = document.createElement("div");
    popup.style.textAlign = "center";
        
    const header = document.createElement("h3");
    header.textContent = `${stopName} Station`.toUpperCase();
    popup.appendChild(header);
    
    const linesHeading = document.createElement("h4");
    linesHeading.textContent = "LINES";
    popup.appendChild(linesHeading);
    
    const lines = document.createElement("p");
    lines.style.marginTop = 0;
    
    for (const routeName of layerGroupStations[stopName]) {
        const line = document.createElement("span");
        line.textContent = routeName;
        line.style.backgroundColor = colours[routeMaps[routeName].routeId];
        line.style.color = textColours[routeMaps[routeName].routeId];
        line.style.whiteSpace = "nowrap";
        lines.appendChild(line);
        
        lines.appendChild(document.createTextNode(" "));
    }
    lines.appendChild(document.createElement("br"));
    
    const setButton = document.createElement("button");
    setButton.textContent = "Set";
    setButton.addEventListener("click", () => {
        setLines(stopName);
        marker.closePopup();
    });
    lines.appendChild(setButton);
    
    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.addEventListener("click", () => {
        addLines(stopName);
        marker.closePopup();
    });
    lines.appendChild(addButton);
    
    const filterButton = document.createElement("button");
    filterButton.textContent = "Filter";
    filterButton.addEventListener("click", () => {
        filterLines(stopName);
        marker.closePopup();
    });
    lines.appendChild(filterButton);
    
    popup.appendChild(lines);
    
    return popup;
}

function setLines(stop_name) {
    for (const [routeName, routeMap] of Object.entries(routeMaps)) {
        if (layerGroupStations[stop_name].includes(routeName)) {
            routeMap.layerGroup.addTo(map);
        } else {
            routeMap.layerGroup.remove();
        }
    }
}

function addLines(stop_name) {
    for (const [routeName, routeMap] of Object.entries(routeMaps)) {
        if (layerGroupStations[stop_name].includes(routeName)) {
            routeMap.layerGroup.addTo(map);
        }
    }
}

function filterLines(stop_name) {
    for (const [routeName, routeMap] of Object.entries(routeMaps)) {
        if (!layerGroupStations[stop_name].includes(routeName)) {
            routeMap.layerGroup.remove();
        }
    }
}

const stations = {}, layerGroupStations = {}, stopMaps = {};
for (const [routeName, stationLine] of Object.entries(stationLines)) {
    for (const stop_name of stationLine) {
        if (!(stop_name in layerGroupStations)) {
            layerGroupStations[stop_name] = [];
        }
        
        layerGroupStations[stop_name].push(routeName);
    }
}

for (const [routeName, routeMap] of Object.entries(routeMaps)) {
    const route = routes.find((route) => {
        return route.route_id === routeMap.routeId;
    });
    
    routeMap.colour = "#" + route.route_color;
    routeMap.textColour = "#" + route.route_text_color;
    routeMap.layerGroup = L.layerGroup();
    routeMap.line = L.geoJSON(
        geojson.features.filter((feature) => {
            return routeMap.shapeIds.includes(feature.properties.SHAPE_ID);
        }),
        { style: { color: routeMap.colour } }
    );
}

const colours = {}, textColours = {}, layerGroups = {};
for (const routeMap of Object.values(routeMaps)) {
    layerGroups[routeMap.routeId] = routeMap.layerGroup.addLayer(routeMap.line);
    colours[routeMap.routeId] = routeMap.colour;
    textColours[routeMap.routeId] = routeMap.textColour;
}

for (const stop of stops) {
    let { stop_name, stop_lat, stop_lon, parent_station } = stop;
    stop_name = stop_name.slice(0, stop_name.indexOf(" Railway Station"));
    
    if (parent_station === "") {
        const marker = L.marker(
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
        marker.bindPopup(
            stationHeader(marker),
            { autoPan: false }
        ).addTo(searchLayer);
        stations[stop_name] = marker;
    }
    
    let { stop_id, ...stopMap } = stop;
    stopMaps[stop_id] = stopMap;
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

let trains = {};
async function updatePositions() {
    positionStatus.textContent = "Retrieving positions...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const response = await fetch("https://metrominder.onrender.com/positions");
        const feed = await response.json();
        
        const updatedTrains = {};
        for (const train of feed.feed.entity) {
            const { latitude, longitude, bearing } = train.vehicle.position;
            const tripId = train.vehicle.trip.tripId;
            const routeId = train.vehicle.trip.routeId;
            const popup = `Position at ${timeString(train.vehicle.timestamp, true)}`;
            
            if (tripId in trains) {
                trains[tripId].marker.setRotation(bearing)
                                     .slideTo([latitude, longitude]);
                trains[tripId].tip.setTooltipContent(popup)
                                  .slideTo([latitude, longitude]);
                updatedTrains[tripId] = trains[tripId];
            } else {
                const consist = train.vehicle.vehicle.id;
                const splitConsist = consist.split("-");
                let car = splitConsist.find((car) => {
                    return car[car.length-1] === 'T';
                });
                
                let length, type, typeCode = "";
                if (car) {
                    length = splitConsist.length;
                    
                    const number = parseInt(car.slice(0, -1));
                    if (1000 <= number && number < 1200) {
                        type = "Comeng";
                        typeCode = "COM";
                    } else if (2500 <= number && number < 2600) {
                        type = "Siemens";
                        typeCode = "SIE";
                    } else if (1300 <= number && number < 1700) {
                        type = "X'Trapolis 100";
                        typeCode = "XT1";
                    } else if (8100 <= number && number < 8900) {
                        type = "X'Trapolis 2.0";
                        typeCode = "XT2";
                    }
                } else if (splitConsist.length > 0) {
                    car = splitConsist[0];
                    const number = parseInt(car.slice(0, -1));
                    if (9000 <= number && number < 10000) {
                        length = 7;
                        type = "HCMT";
                        typeCode = "HCM";
                    } else if (7000 <= number && number < 7030) {
                        length = 1;
                        type = "Sprinter";
                        typeCode = "SPR";
                    }
                }
                
                if ((!length || !type) &&
                    routeId === "aus:vic:vic-02-STY:") {
                        length = 1;
                        type = "Sprinter";
                        typeCode = "SPR";
                }
                
                let consistInfo = `<p style="margin-bottom: 0">
                                       <b>`;
                
                if (length) {
                    consistInfo += `${length}-car`;
                }
                
                if (type) {
                    consistInfo += ` ${type}`;
                }
                
                consistInfo += `</b>
                            </p>
                            <p style="margin-top: 0">
                                ${consist}
                            </p>`;
                
                const routeCode = routeId.slice(15, 18);
                const tipContent = document.createElement("div");
                tipContent.textContent = routeCode;
                tipContent.style.color = textColours[routeId];
                                 
                const marker = L.marker.arrowCircle(
                    [latitude, longitude],
                    {
                        iconOptions: {
                            stroke: textColours[routeId],
                            color: colours[routeId],
                            size: 40,
                            rotation: bearing
                        },
                        pane: "trainPane",
                        rotateWithView: true
                    }
                );
                
                const tip = L.marker(
                    [latitude, longitude],
                    {
                        icon: L.divIcon({
                            html: tipContent,
                            className: "train-tip"
                        }),
                        pane: "trainPane"
                    }
                ).bindTooltip(
                    L.tooltip().setContent(popup)
                ).bindPopup(
                    consistInfo + "No trip information.",
                    { autoPan: false }
                );
                
                updatedTrains[tripId] = {
                    marker: marker,
                    tip: tip,
                    consistInfo: consistInfo,
                    routeCode: routeCode,
                    typeCode: typeCode,
                    tipContent: tipContent
                };
                
                layerGroups[routeId].addLayer(marker).addLayer(tip);
            }
        }
        
        for (const tripId in trains) {
            if (!(tripId in updatedTrains)) {
                trains[tripId].marker.remove();
                trains[tripId].tip.remove();
            }
        }
        trains = updatedTrains;
        
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
    return stopName.replace("Station", "")
                   .replace("Railway", "")
                   .replace("Rail Replacement Bus Stop", "")
                   .trim();
}

async function updateTrips() {
    tripStatus.textContent = "Retrieving trip updates...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const response = await fetch("https://metrominder.onrender.com/trips");
        const feed = await response.json();
        
        const departures = {};
        for (const stationName in stations) {
            departures[stationName] = [];
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
                    const lastStopName = shortName(stopMaps[lastStop.stopId].stop_name);
                    let popup = `<h3 style="background-color: ${colours[routeId]}; color: ${textColours[routeId]};">
                                     SERVICE TO ${lastStopName.toUpperCase()}
                                 </h3>`;
                    
                    if (tripId in trains) {
                        popup += trains[tripId].consistInfo;
                    }
                    
                    let future = false;
                    for (const stop of stopTimeUpdate) {
                        const stopMap = stopMaps[stop.stopId];
                        const platform = stopMap.platform_code;
                        
                        if (stop.departure &&
                            stop.departure.time >= Math.floor(Date.now()/1000)) {
                                let parentStation = stopMap;
                                while (parentStation.parent_station !== "") {
                                    parentStation = stopMaps[parentStation.parent_station];
                                }
                                let parentName = parentStation.stop_name;
                                parentName = parentName.slice(0, parentName.indexOf(" Railway Station"));
                                
                                departures[parentName].push({
                                    routeId: routeId,
                                    lastStopName: lastStopName,
                                    platform: platform,
                                    time: stop.departure.time
                                });
                        }
                        
                        if (tripId in trains && stop.arrival) {
                            const stopName = shortName(stopMap.stop_name);
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
                    
                    if (tripId in trains) {
                        trains[tripId].tip.setPopupContent(popup);
                    }
            }
        }
        
        for (const [stationName, stationMarker] of Object.entries(stations)) {
            let popup = stationHeader(stationMarker);
            
            const stationDepartures = departures[stationName];
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
                    serviceCell.style.backgroundColor = colours[departure.routeId];
                    serviceCell.style.color = textColours[departure.routeId];
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

const layerGroupsNamed = {};
for (const [routeName, routeMap] of Object.entries(routeMaps)) {
    routeMap.layerGroup.addEventListener("add", () => {
        for (const stop_name of stationLines[routeName]) {
            const station = stations[stop_name];
            station.options.visibility++;
            stationLayer.addLayer(station);
        }
    });
    
    routeMap.layerGroup.addEventListener("remove", () => {
        for (const stop_name of stationLines[routeName]) {
            const station = stations[stop_name];
            station.options.visibility--;
            if (station.options.visibility == 0) {
                stationLayer.removeLayer(station);
            }
        }
    });
    
    layerGroupsNamed[routeName] = {
        label: `<span style="background-color: ${routeMap.colour}; color: ${routeMap.textColour};">
                    ${routeName} line&nbsp
                </span>`,
        layer: routeMap.layerGroup.addTo(map)
    };
}

L.control.layers.tree(null, [
    {
        label: "Train marker labels",
        children: [
            {
                label: `<label title="Label train markers with line code">
                            <input type="radio" name="labels" value="line" checked>
                            Line
                        </label>`
            },
            {
                label: `<label title="Label train markers with type code">
                            <input type="radio" name="labels" value="type">
                            Type
                        </label>`
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
            layerGroupsNamed["Sandringham"],
            {
                label: `<span style="background-color: #279FD5; color: black;">
                            Caulfield group
                        <span>
                        &nbsp`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerGroupsNamed["Cranbourne"],
                    layerGroupsNamed["Pakenham"]
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
                    layerGroupsNamed["Hurstbridge"],
                    layerGroupsNamed["Mernda"]
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
                    layerGroupsNamed["Craigieburn"],
                    layerGroupsNamed["Sunbury"],
                    layerGroupsNamed["Upfield"]
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
                            layerGroupsNamed["Frankston"],
                            layerGroupsNamed["Stony Point"]
                        ]
                    },
                    {
                        label: `<span style="background-color: #028430; color: white;">
                                    West
                                </span>
                                &nbsp`,
                        selectAllCheckbox: true,
                        children: [
                            layerGroupsNamed["Werribee"],
                            layerGroupsNamed["Williamstown"]
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
                    layerGroupsNamed["Glen Waverley"],
                    {
                        label: `<span style="background-color: #152C6B; color: white;">
                                    Camberwell
                                </span>
                                &nbsp`,
                        selectAllCheckbox: true,
                        children: [
                            layerGroupsNamed["Alamein"],
                            {
                                label: `<span style="background-color: #152C6B; color: white;">
                                            Ringwood
                                        </span>
                                        &nbsp`,
                                selectAllCheckbox: true,
                                children: [
                                    layerGroupsNamed["Belgrave"],
                                    layerGroupsNamed["Lilydale"]
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
                    layerGroupsNamed["Flemington Racecourse"],
                    layerGroupsNamed["City Circle"]
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
                        routeMaps["Flemington Racecourse"].layerGroup.remove();
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
                         routeMaps["Werribee"].layerGroup.addTo(map);
                         routeMaps["Williamstown"].layerGroup.addTo(map);
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
                         routeMaps["Werribee"].layerGroup.addTo(map);
                         routeMaps["Williamstown"].layerGroup.addTo(map);
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
                         routeMaps["Werribee"].layerGroup.addTo(map);
                         routeMaps["Williamstown"].layerGroup.addTo(map);
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
                        routeMaps["Frankston"].layerGroup.addTo(map);
                        routeMaps["Flemington Racecourse"].layerGroup.remove();
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
                        routeMaps["Frankston"].layerGroup.addTo(map);
                    }
                }]
            }
        ]
    }
], {
    selectorBack: true
}).addTo(map);

document.querySelector(
    "input[name=labels][value=line]"
).addEventListener("change", () => {
    for (const train of Object.values(trains)) {
        train.tipContent.textContent = train.routeCode;
    }
});

document.querySelector(
    "input[name=labels][value=type]"
).addEventListener("change", () => {
    for (const train of Object.values(trains)) {
        train.tipContent.textContent = train.typeCode;
    }
});
