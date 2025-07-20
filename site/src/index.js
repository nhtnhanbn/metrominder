import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import "leaflet-fullscreen";
import "leaflet-rotate";
import "leaflet-search/src/leaflet-search.css";
import "leaflet-search";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
import "leaflet.control.layers.tree";
import "./leaflet-arrowcircle/src/L.ArrowCircle.js";
import geojson from "./metro_lines.geojson";
import stops from "../../data/gtfsschedule/stops.txt";
import routes from "../../data/gtfsschedule/routes.txt";
import stationLines from "../../data/stationLines.json";
import { routeMaps } from "./routeMaps.js";
import stationIcon from "./station.svg";
import "./style.css";

function stationHeader(stopName) {
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
    
    const button = document.createElement("button");
    button.textContent = "Filter lines";
    button.addEventListener("click", () => {
        filterLines(stopName)
    });
    lines.appendChild(button);
    
    popup.appendChild(lines);
    
    return popup;
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

const searchLayer = L.layerGroup();
for (const stop of stops) {
    let { stop_name, stop_lat, stop_lon, parent_station } = stop;
    stop_name = stop_name.slice(0, stop_name.indexOf(" Railway Station"));
    
    if (parent_station === "") {
        stations[stop_name] = L.marker(
            [stop_lat, stop_lon],
            {
                icon: L.icon({
                    iconUrl: stationIcon,
                    iconSize: [20, 20]
                }),
                title: stop_name,
                visibility: 0
            }
        ).bindPopup(
            stationHeader(stop_name),
            { autoPan: false }
        ).addTo(searchLayer);
    }
    
    let { stop_id, ...stopMap } = stop;
    stopMaps[stop_id] = stopMap;
}

function filterLines(stop_name) {
    for (const [routeName, routeMap] of Object.entries(routeMaps)) {
        if (layerGroupStations[stop_name].includes(routeName)) {
            routeMap.layerGroup.addTo(map);
        } else {
            routeMap.layerGroup.remove();
        }
    }
}

let trains = {};
async function updatePositions() {
    const response = await fetch("https://metrominder.onrender.com/positions");
    const feed = await response.json();
    
    const updatedTrains = {};
    for (const train of feed.feed.entity) {
        const { latitude, longitude, bearing } = train.vehicle.position;
        const tripId = train.vehicle.trip.tripId;
        const routeId = train.vehicle.trip.routeId;
        const popup = `${Math.floor(Date.now()/1000)-train.vehicle.timestamp} secs ago`;
        
        if (tripId in trains) {
            trains[tripId].marker.setLatLng([latitude, longitude]);
            trains[tripId].tip.setLatLng([latitude, longitude])
                              .setTooltipContent(popup);
            updatedTrains[tripId] = trains[tripId];
        } else {
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
                        html: `<div style="color: ${textColours[routeId]};">
                                   ${routeId.slice(15, 18)}
                               </div>`,
                        className: "train-tip"
                    }),
                    pane: "trainPane"
                }
            ).bindTooltip(
                L.tooltip().setContent(popup)
            ).bindPopup("No trip information.", { autoPan: false });
            updatedTrains[tripId] = { marker: marker, tip: tip };
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
    
    const sinceUpdate = Math.floor((Date.now()-feed.timestamp)/1000);
    map.attributionControl.setPrefix(
        `DTP last updated ${sinceUpdate} secs ago | <a href="https://leafletjs.com">Leaflet</a>`
    );
    
    setTimeout(updatePositions, 1000);
}
updatePositions();

function shortName(stopName) {
    return stopName.replace("Station", "")
                   .replace("Railway", "")
                   .replace("Rail Replacement Bus Stop", "")
                   .trim();
}

function timeString(seconds) {
    const date = new Date(1000*seconds);
    
    return date.getHours().toString().padStart(2, "0") +
           ":" +
           date.getMinutes().toString().padStart(2, "0");
}

async function updateTrips() {
    const response = await fetch("https://metrominder.onrender.com/trips");
    const feed = await response.json();
    
    const departures = {};
    for (const stationName in stations) {
        departures[stationName] = [];
    }
    
    for (const trip of feed.feed.entity) {
        const tripUpdate = trip.tripUpdate;
        const tripId = tripUpdate.trip.tripId;
        if (tripId in trains) {
            const routeId = tripUpdate.trip.routeId;
            const stopTimeUpdate = tripUpdate.stopTimeUpdate;
            const lastStop = stopTimeUpdate[stopTimeUpdate.length-1];
            const lastStopName = shortName(stopMaps[lastStop.stopId].stop_name);
            let popup = `<h3 style="background-color: ${colours[routeId]}; color: ${textColours[routeId]}; text-align: center;">
                             SERVICE TO ${lastStopName.toUpperCase()}
                         </h3>`;
            
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
                
                if (stop.arrival) {
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
            popup += `</table>`;
            
            trains[tripId].tip.setPopupContent(popup);
        }
    }
    
    for (const [stationName, stationMarker] of Object.entries(stations)) {
        let popup = stationHeader(stationName);
        
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
        
        stationMarker.setPopupContent(popup);
    }
    
    setTimeout(updateTrips, 1000);
};
updateTrips();

const stationLayer = L.layerGroup();
const map = L.map("map", {
    center: [-37.8, 145],
    zoom: 11,
    fullscreenControl: true,
    rotate: true,
    rotateControl: { closeOnZeroBearing: false },
    touchRotate: true
});
map.createPane("trainPane", map.getPane("norotatePane")).style.zIndex = 625;

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
    layer: searchLayer,
    zoom: 14,
    initial: false,
    firstTipSubmit: true,
    textErr: "Station not found."
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
        attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`
    }
).addTo(map);

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
                    ${routeName} line
                </span>`,
        layer: routeMap.layerGroup.addTo(map)
    };
}

L.control.layers.tree(null, [
    {
        label: "Show stations",
        layer: stationLayer
    },
    {
        label: "All lines",
        selectAllCheckbox: true,
        children: [
            layerGroupsNamed["Sandringham"],
            {
                label: `<span style="background-color: #279FD5; color: black;">
                            Caulfield group
                        <span>`,
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
                        </span>`,
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
                        </span>`,
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
                        </span>`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    {
                        label: `<span style="background-color: #028430; color: white;">
                                    Frankston
                                </span>`,
                        selectAllCheckbox: true,
                        children: [
                            layerGroupsNamed["Frankston"],
                            layerGroupsNamed["Stony Point"]
                        ]
                    },
                    {
                        label: `<span style="background-color: #028430; color: white;">
                                    West
                                </span>`,
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
                        </span>`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerGroupsNamed["Glen Waverley"],
                    {
                        label: `<span style="background-color: #152C6B; color: white;">
                                    Camberwell
                                </span>`,
                        selectAllCheckbox: true,
                        children: [
                            layerGroupsNamed["Alamein"],
                            {
                                label: `<span style="background-color: #152C6B; color: white;">
                                            Ringwood
                                        </span>`,
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
        label: "Presets",
        collapsed: true,
        children: [
            {
                label: "City Loop",
                layer: L.layerGroup(
                    Object.values(routeMaps).filter((routeMap) => {
                        return !["#F178AF", "#028430"].includes(routeMap.colour);
                    }).map((routeMap) => routeMap.layerGroup)
                )
            },
            {
                label: "Richmond station",
                layer: L.layerGroup(
                    Object.entries(routeMaps).filter(([routeName, routeMap]) => {
                        return routeName !== "Stony Point" &&
                               ["#F178AF", "#028430", "#279FD5", "#152C6B"].includes(routeMap.colour);
                    }).map(([routeName, routeMap]) => routeMap.layerGroup)
                )
            },
            {
                label: "South Yarra station",
                layer: L.layerGroup(
                    Object.entries(routeMaps).filter(([routeName, routeMap]) => {
                        return routeName !== "Stony Point" &&
                               ["#F178AF", "#028430", "#279FD5"].includes(routeMap.colour);
                    }).map(([routeName, routeMap]) => routeMap.layerGroup)
                )
            },
            {
                label: "Caulfield station",
                layer: L.layerGroup(
                    Object.entries(routeMaps).filter(([routeName, routeMap]) => {
                        return ["Frankston", "Cranbourne", "Pakenham"].includes(routeName);
                    }).map(([routeName, routeMap]) => routeMap.layerGroup)
                )
            },
            {
                label: "North Melbourne station",
                layer: L.layerGroup(
                    Object.entries(routeMaps).filter(([routeName, routeMap]) => {
                        return routeName !== "Stony Point" &&
                               ["#FFBE00", "#028430"].includes(routeMap.colour);
                    }).map(([routeName, routeMap]) => routeMap.layerGroup)
                )
            }
        ]
    }
], {
    selectorBack: true
}).addTo(map);
