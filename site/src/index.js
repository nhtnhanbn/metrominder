import "./style.css";
import geojson from "./metro_lines.geojson";
import stops from "../../data/gtfsschedule/stops.txt";
import stationIcon from "./station.svg";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { routeMaps } from "./routeMaps.js";

for (const routeMap of Object.values(routeMaps)) {
    routeMap.layerGroup = L.layerGroup();
}

let feed;
setInterval(async () => {
    const response = await fetch("https://metrominder.onrender.com");
    const feed = await response.json();
    
    const layerGroups = {};
    for (const routeMap of Object.values(routeMaps)) {
        layerGroups[routeMap.routeId] = routeMap.layerGroup.clearLayers().addLayer(
            L.geoJSON(
                geojson.features.filter((feature) => {
                    return routeMap.shapeIds.includes(feature.properties.SHAPE_ID);
                }),
                { style: { color: routeMap.colour } }
            )
        );
    }
    
    for (const train of feed.feed.entity) {
        const { latitude, longitude } = train.vehicle.position;
        layerGroups[train.vehicle.trip.routeId].addLayer(
            L.circleMarker(
                [latitude, longitude],
                { radius: 10 }
            )
        );
    }
    
    for (const routeMap of Object.values(routeMaps)) {
        routeMap.layerGroup = layerGroups[routeMap.routeId];
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

for (const stop of stops) {
    const { stop_lat, stop_lon, parent_station } = stop;
    if (parent_station === "") {
        L.marker(
            [stop_lat, stop_lon],
            {
                icon: L.icon({
                    iconUrl: stationIcon,
                    iconSize: [20, 20]
                })
            }
        ).addTo(map);
    }
}

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
