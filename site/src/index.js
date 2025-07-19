import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-rotate";
import "leaflet-search";
import "leaflet-search/src/leaflet-search.css";
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

const stations = {}, layerGroupStations = {};
const searchLayer = L.layerGroup();
for (const stop of stops) {
    let { stop_name, stop_lat, stop_lon, parent_station } = stop;
    stop_name = stop_name.slice(0, stop_name.indexOf(" Railway Station"));
    
    if (parent_station === "") {
        const popup = document.createElement("div");
        
        const header = document.createElement("b");
        header.textContent = stop_name;
        popup.appendChild(header);
        
        popup.appendChild(document.createElement("br"));
        
        const button = document.createElement("button");
        button.textContent = "Filter lines";
        button.addEventListener("click", () => {
            filterLines(stop_name)
        });
        popup.appendChild(button);
        
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
        ).bindPopup(popup).addTo(searchLayer);
        layerGroupStations[stop_name] = [];
    }
}

for (const [routeName, stationLine] of Object.entries(stationLines)) {
    for (const stop_name of stationLine) {
        layerGroupStations[stop_name].push(routeName);
    }
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

async function fetchLines() {
    const response = await fetch("https://metrominder.onrender.com");
    const feed = await response.json();
    
    const layerGroups = {}, colours = {}, textColours = {};
    for (const routeMap of Object.values(routeMaps)) {
        layerGroups[routeMap.routeId] = routeMap.layerGroup.clearLayers();
        layerGroups[routeMap.routeId].addLayer(routeMap.line);
        colours[routeMap.routeId] = routeMap.colour;
        textColours[routeMap.routeId] = routeMap.textColour;
    }
    
    for (const train of feed.feed.entity) {
        const { latitude, longitude, bearing } = train.vehicle.position;
        const routeId = train.vehicle.trip.routeId;
        layerGroups[routeId].addLayer(
            L.marker.arrowCircle(
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
            )
        ).addLayer(
            L.marker(
                [latitude, longitude],
                {
                    icon: L.divIcon({
                        html: `<div style="color: ${textColours[routeId]};">${routeId.slice(15, 18)}</div>`,
                        className: "train-tip"
                    }),
                    pane: "trainPane"
                }
            )
        );
    }
    
    setTimeout(fetchLines, 1000);
}
fetchLines();

const stationLayer = L.layerGroup();
const map = L.map("map", {
    center: [-37.8, 145],
    zoom: 11,
    rotate: true,
    rotateControl: { closeOnZeroBearing: false },
    touchRotate: true
});
map.createPane("trainPane", map.getPane("norotatePane")).style.zIndex = 625;

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
    foundMarker = data.layer.addTo(map);
}).addTo(map);
searchLayer.remove();

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        opacity: 0.5,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
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
        label: `<span style="background-color: ${routeMap.colour}; color: ${routeMap.textColour}">${routeName} line</span>`,
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
                label: `<span style="background-color: #279FD5; color: black">Caulfield group</span>`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerGroupsNamed["Cranbourne"],
                    layerGroupsNamed["Pakenham"]
                ]
            },
            {
                label: `<span style="background-color: #BE1014; color: white">Clifton Hill group</span>`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerGroupsNamed["Hurstbridge"],
                    layerGroupsNamed["Mernda"]
                ]
            },
            {
                label: `<span style="background-color: #FFBE00; color: black">Northern group</span>`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerGroupsNamed["Craigieburn"],
                    layerGroupsNamed["Sunbury"],
                    layerGroupsNamed["Upfield"]
                ]
            },
            {
                label: `<span style="background-color: #028430; color: white">Cross-city group</span>`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    {
                        label: `<span style="background-color: #028430; color: white">Frankston</span>`,
                        selectAllCheckbox: true,
                        children: [
                            layerGroupsNamed["Frankston"],
                            layerGroupsNamed["Stony Point"]
                        ]
                    },
                    {
                        label: `<span style="background-color: #028430; color: white">West</span>`,
                        selectAllCheckbox: true,
                        children: [
                            layerGroupsNamed["Werribee"],
                            layerGroupsNamed["Williamstown"]
                        ]
                    }
                ]
            },
            {
                label: `<span style="background-color: #152C6B; color: white">Burnley group</span>`,
                collapsed: true,
                selectAllCheckbox: true,
                children: [
                    layerGroupsNamed["Glen Waverley"],
                    {
                        label: `<span style="background-color: #152C6B; color: white">Camberwell</span>`,
                        selectAllCheckbox: true,
                        children: [
                            layerGroupsNamed["Alamein"],
                            {
                                label: `<span style="background-color: #152C6B; color: white">Ringwood</span>`,
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
