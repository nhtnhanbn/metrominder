import fs from "fs/promises";
import { routeMaps } from "../site/src/routeMaps.js";

const GEOJSON_URL = "https://opendata.transport.vic.gov.au/dataset/6d36dfd9-8693-4552-8a03-05eb29a391fd/resource/52e5173e-b5d5-4b65-9b98-89f225fc529c/download/public_transport_lines.geojson";
const shapeIds = Object.values(routeMaps).flatMap((routeMap) => {
    return routeMap.shapeIds;
});

(async () => {
    console.log("Fetching...");
    const response = await fetch(GEOJSON_URL);
    console.log("Fetched.");
    
    console.log("Reading...");
    const data = await response.json();
    console.log("Read.");
    
    console.log("Filtering...");
    const features = data.features.filter((feature) => {
        return (feature.properties.MODE == "METRO TRAIN") &&
               shapeIds.includes(feature.properties.SHAPE_ID);
    });
    console.log("Filtered.");
    
    console.log("Stringifying...");
    const geojson = JSON.stringify({
        type: "FeatureCollection",
        name: "metro_lines",
        features: features
    });
    console.log("Stringified.");
    
    console.log("Writing...");
    await fs.writeFile("../site/src/metro_lines.geojson", geojson);
    console.log("Written.");
})();
