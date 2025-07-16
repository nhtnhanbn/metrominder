import "./style.css";
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
fetch(
    "https://metrominder.onrender.com"
).then((response) => {
    return response.json();
}).then((response) => {
    feed = response;
    console.log(feed);
    
    for (const train of feed.feed.entity) {
        const { latitude, longitude } = train.vehicle.position;
        L.circle(
            [latitude, longitude],
            { radius: 100 }
        ).addTo(map);
    }
});

const map = L.map("map").setView([-37.8, 145], 11);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    }
).addTo(map);

const body = document.querySelector("body");
for (const route in routeMaps) {
    const button = document.createElement("button");
    button.textContent = route;
    button.addEventListener("click", () => {
        
    });
    body.appendChild(button);
}
