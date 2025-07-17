import "leaflet/dist/leaflet.css";
import L from "leaflet";
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

function refreshLines(feed) {
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
                        stroke: textColours[routeId],
                        color: colours[routeId],
                        size: 40,
                        rotation: bearing
                    },
                    pane: "trains"
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
}

let feed;
setInterval(async () => {
    const response = await fetch("https://metrominder.onrender.com");
    feed = await response.json();
    refreshLines(feed);
}, 1000);

const map = L.map("map").setView([-37.8, 145], 11);
map.createPane("trains").style.zIndex = 625;

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
    layerGroupsNamed[routeName] = routeMap.layerGroup;
    
    // Removing a line layer group removes its stations
    routeMap.layerGroup.addEventListener("remove", () => {
        setTimeout(() => { // wait for the layer removals to be done
            refreshLines(feed);
        }, 0);
    });
}
L.control.layers(null, layerGroupsNamed).addTo(map);
