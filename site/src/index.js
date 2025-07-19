import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-rotate";
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

const stations = {};
for (const stop of stops) {
    let { stop_name, stop_lat, stop_lon, parent_station } = stop;
    stop_name = stop_name.slice(0, stop_name.indexOf(" Railway Station"));
    
    if (parent_station === "") {
        stations[stop_name] = {
            marker: L.marker(
                [stop_lat, stop_lon],
                {
                    icon: L.icon({
                        iconUrl: stationIcon,
                        iconSize: [20, 20]
                    })
                }
            ),
            visibility: 0
        };
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

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        opacity: 0.5,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    }
).addTo(map);

const layerGroupsNamed = {};
const stationLayer = L.layerGroup().addTo(map);
for (const [routeName, routeMap] of Object.entries(routeMaps)) {
    layerGroupsNamed[routeName] = {
        label: `<span style="background-color: ${routeMap.colour}; color: ${routeMap.textColour}">${routeName} line</span>`,
        layer: routeMap.layerGroup
    };
    
    routeMap.layerGroup.addEventListener("add", () => {
        for (const stop_name of stationLines[routeName]) {
            const station = stations[stop_name];
            station.visibility++;
            stationLayer.addLayer(station.marker);
        }
    });
    
    routeMap.layerGroup.addEventListener("remove", () => {
        for (const stop_name of stationLines[routeName]) {
            const station = stations[stop_name];
            station.visibility--;
            if (station.visibility == 0) {
                station.marker.remove();
            }
        }
    });
}

L.control.layers.tree(null, {
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
}, {
    selectorBack: true
}).addTo(map);
