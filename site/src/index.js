import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-arrowcircle";
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
        stations[stop_name] = L.marker(
            [stop_lat, stop_lon],
            {
                icon: L.icon({
                    iconUrl: stationIcon,
                    iconSize: [20, 20]
                })
            }
        );
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
    
    routeMap.stations = L.layerGroup();
    for (const stop_name of stationLines[routeName]) {
        routeMap.stations.addLayer(stations[stop_name]);
    }
}

let feed;
setInterval(async () => {
    const response = await fetch("https://metrominder.onrender.com");
    const feed = await response.json();
    
    const layerGroups = {}, colours = {}, textColours = {};
    for (const routeMap of Object.values(routeMaps)) {
        layerGroups[routeMap.routeId] = routeMap.layerGroup.clearLayers();
        layerGroups[routeMap.routeId].addLayer(routeMap.line).addLayer(routeMap.stations);
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
                        color: colours[routeId],
                        size: 40,
                        rotation: bearing
                    }
                }
            ).bindTooltip(L.tooltip({
                direction: "center",
                permanent: true,
                opacity: 1,
                className: "train-tip",
                content: `<span style='color:${textColours[routeId]}'>${routeId.slice(15, 18)}</span>`
            }))
        );
    }
}, 1000);

const map = L.map("map").setView([-37.8, 145], 11);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        opacity: 0.5,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    }
).addTo(map);

function addShape(shapeId) {
    L.geoJSON(geojson.features.filter((f)=>f.properties.SHAPE_ID===shapeId), {
        style: (f) => {
            return {
                color: "#" + Math.floor(Math.random()*16777215).toString(16)
            };
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(feature.properties.HEADSIGN + feature.properties.SHAPE_ID);
        }
    }).addTo(map);
}

const body = document.querySelector("body");
for (const route in routeMaps) {
    const label = document.createElement("label");
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => {
        const layerGroup = routeMaps[route].layerGroup;
        
        if (checkbox.checked) {
            layerGroup.addTo(map);
        } else {
            layerGroup.remove();
        }
    });
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(route));
    
    body.appendChild(label);
}

const text = document.createElement("input");
text.type = "text";
body.appendChild(text);

const button = document.createElement("button");
button.textContent = "go";
button.addEventListener("click", () => { addShape(text.value); });
body.appendChild(button);
