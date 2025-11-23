import fs from "fs/promises";
import { metroTrainRouteMaps, regionTrainRouteMaps } from "../site/src/routeMapsInitial.js";

const metroTrainShapeIds = metroTrainRouteMaps.values().flatMap((routeMap) => {
    return routeMap.shapeIds;
}).toArray();

const regionTrainShapeIds = regionTrainRouteMaps.values().flatMap((routeMap) => {
    return routeMap.shapeIds;
}).toArray();

(async () => {
    console.log("Fetching...");
    const response = await fs.readFile("./public_transport_lines.geojson");
    console.log("Fetched.");
    
    console.log("Reading...");
    const data = JSON.parse(response);
    console.log("Read.");
    
    console.log("Filtering...");

    const metroTrainFeatures = data.features.filter((feature) => {
        return (feature.properties.MODE == "METRO TRAIN") && metroTrainShapeIds.includes(feature.properties.SHAPE_ID);
    });

    const metroTramFeatures = data.features.filter((feature) => {
        return feature.properties.MODE == "METRO TRAM";
    });

    const regionTrainFeatures = data.features.filter((feature) => {
        return (feature.properties.MODE == "REGIONAL TRAIN") && regionTrainShapeIds.includes(feature.properties.SHAPE_ID);
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

    const regionTrainRoutes = JSON.stringify({
        type: "FeatureCollection",
        name: "regionTrainRoutes",
        features: regionTrainFeatures
    });

    console.log("Stringified.");
    
    console.log("Writing...");
    await fs.writeFile("../site/src/metroTrainRoutes.geojson", metroTrainRoutes);
    await fs.writeFile("../site/src/metroTramRoutes.geojson", metroTramRoutes);
    await fs.writeFile("../site/src/regionTrainRoutes.geojson", regionTrainRoutes);
    console.log("Written.");
})();
