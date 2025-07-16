import "./style.css";
import geojson from "./metro_lines.geojson";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

class RouteMap {
    constructor(routeId) {
        this.routeId = routeId;
        this.layerGroup = L.layerGroup();
    }
    
    getLongRouteId() {
        return `aus:vic:vic-02-${this.routeId}:`;
    }
}

const routeMaps = {
    "Alamein": new RouteMap("ALM"),
    "Belgrave": new RouteMap("BEG"),
    "Cranbourne": new RouteMap("CBE"),
    "Craigieburn": new RouteMap("CGB"),
    "Frankston": new RouteMap("FKN"),
    "Glen Waverley": new RouteMap("GWY"),
    "Hurstbridge": new RouteMap("HBE"),
    "Lilydale": new RouteMap("LIL"),
    "Mernda": new RouteMap("MDD"),
    "Pakenham": new RouteMap("PKM"),
    "Sandringham": new RouteMap("SHM"),
    "Stony Point": new RouteMap("STY"),
    "Sunbury": new RouteMap("SUY"),
    "Upfield": new RouteMap("UFD"),
    "Werribee": new RouteMap("WER"),
    "Williamstown": new RouteMap("WIL")
};

let feed;
setInterval(async () => {
    const response = await fetch("https://metrominder.onrender.com");
    const feed = await response.json();
    
    const layerGroups = {};
    for (const routeMap of Object.values(routeMaps)) {
        layerGroups[routeMap.getLongRouteId()] = routeMap.layerGroup.clearLayers();
    }
    
    for (const train of feed.feed.entity) {
        const { latitude, longitude } = train.vehicle.position;
        layerGroups[train.vehicle.trip.routeId].addLayer(
            L.circle(
                [latitude, longitude],
                { radius: 100 }
            )
        );
    }
    
    for (const routeMap of Object.values(routeMaps)) {
        routeMap.layerGroup = layerGroups[routeMap.getLongRouteId()];
    }
}, 3000);

const map = L.map("map").setView([-37.8, 145], 11);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    }
).addTo(map);

L.geoJSON(geojson, {
    style: (f) => {
        return {
            color: "#" + Math.floor(Math.random()*16777215).toString(16)
        };
    }
}).addTo(map);

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
