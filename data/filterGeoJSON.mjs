import fs from "fs/promises";
import { metroTrainRouteMaps } from "../site/src/routeMapsInitial.js";

const GEOJSON_URL = "https://opendata.transport.vic.gov.au/dataset/6d36dfd9-8693-4552-8a03-05eb29a391fd/resource/52e5173e-b5d5-4b65-9b98-89f225fc529c/download/public_transport_lines.geojson";
const shapeIds = metroTrainRouteMaps.values().flatMap((routeMap) => {
    return routeMap.shapeIds;
}).toArray();

(async () => {
    console.log("Fetching...");
    const response = await fetch(GEOJSON_URL);
    console.log("Fetched.");
    
    console.log("Reading...");
    const data = await response.json();
    console.log("Read.");
    
    console.log("Filtering...");

    const metroTrainFeatures = data.features.filter((feature) => {
        return (feature.properties.MODE == "METRO TRAIN") && shapeIds.includes(feature.properties.SHAPE_ID);
    });

    const metroTramFeatures = data.features.filter((feature) => {
        return feature.properties.MODE == "METRO TRAM";
    });

    console.log("Filtered.");
    
    console.log("Stringifying...");

    const metroTrainRoutes = JSON.stringify({
        type: "FeatureCollection",
        name: "metroTrainRoutes",
        features: metroTrainFeatures
    });

    const metroTramRoutes = JSON.stringify({
        type: "FeatureCollection",
        name: "metroTramRoutes",
        features: metroTramFeatures
    });

    console.log("Stringified.");
    
    console.log("Writing...");
    await fs.writeFile("../site/src/metroTrainRoutes.geojson", metroTrainRoutes);
    await fs.writeFile("../site/src/metroTramRoutes.geojson", metroTramRoutes);
    console.log("Written.");
})();
