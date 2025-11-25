import "leaflet/dist/leaflet.css";
import "leaflet-search/src/leaflet-search.css";
import "leaflet-search";
import L from "leaflet";
import trainGeojson from "./fullTrainRoutes.geojson";
import "./style.css";

const map = L.map("map").fitBounds([[-38.4, 145.6], [-37.5, 144.5]]);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        opacity: 0.5,
        attribution: `&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>`
    }
).addTo(map);

const searchLayer = L.layerGroup();
let foundMarker;
(new L.Control.Search({
    position: "topright",
    layer: searchLayer,
    moveToLocation: (latlng, title, map) => {},
    initial: false,
    delayType: 0,
    firstTipSubmit: true,
    autoResize: false,
    autoCollapse: true,
    autoCollapseTime: 1e9,
    textErr: "Feature not found.",
    textPlaceholder: "Search routes...                         ",
    marker: false
})).addEventListener("search:locationfound", (data) => {
    foundMarker = data.layer;
    foundMarker.remove();
    foundMarker.options.routeLayer.setStyle({ color: "red" }).bringToFront().addTo(map);
    map.fitBounds(foundMarker.options.bounds, { padding: [100, 100] });
}).addTo(map);
searchLayer.remove();

const geojsonLayers = new Set();
for (const feature of trainGeojson.features) if (feature.properties.SHAPE_ID) {
    const geojsonLayer = L.geoJSON(feature);
    const bounds = geojsonLayer.getBounds();
    
    const dummyLayer = L.circleMarker(
        bounds.getCenter(),
        {
            radius: 0,
            opacity: 0,
            title: feature.properties.SHAPE_ID,
            routeLayer: geojsonLayer,
            bounds: bounds
        }
    );

    dummyLayer.addTo(searchLayer);
    geojsonLayer.addTo(map);
    geojsonLayers.add(geojsonLayer);
}

const clearButton = document.createElement("button");
clearButton.textContent = "Clear all";
clearButton.addEventListener("click", () => {
    for (const geojsonLayer of geojsonLayers) {
        geojsonLayer.remove();
    }
});
document.querySelector(".leaflet-top.leaflet-right").appendChild(clearButton);

const addButton = document.createElement("button");
addButton.textContent = "Add all";
addButton.addEventListener("click", () => {
    for (const geojsonLayer of geojsonLayers) {
        geojsonLayer.addTo(map);
    }
});
document.querySelector(".leaflet-top.leaflet-right").appendChild(addButton);