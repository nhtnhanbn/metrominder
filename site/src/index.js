import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

let feed;
fetch(
    "http://10.0.0.238:3000"
).then((response) => {
    return response.json();
}).then((response) => {
    feed = response;
});

const map = L.map("map").setView([-37.8, 145], 11);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    }
).addTo(map);

L.circle(
    [-37.8, 145],
    { radius: 100 }
).addTo(map);
