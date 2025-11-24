import fs from "fs/promises";
import { metroTrainRouteMaps, regionTrainRouteMaps } from "../site/src/routeMapsInitial.js";

const ROUNDER = 10000; // round coordinates to 4 decimal places

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

    const busFeatures = data.features.filter((feature) => {
        return feature.properties.MODE == "METRO BUS" || feature.properties.MODE == "REGIONAL BUS";
    });

    console.log("Filtered.");

    console.log("Minifying...");
    for (const features of [metroTrainFeatures, metroTramFeatures, regionTrainFeatures, busFeatures]) {
        for (const feature of features) {
            if (["METRO TRAIN", "REGIONAL TRAIN"].includes(feature.properties.MODE)) {
                feature.properties.SHORT_NAME = feature.properties.SHAPE_ID.slice(2, 5);
            }

            delete feature.properties.SHAPE_ID;
            delete feature.properties.HEADSIGN;
            delete feature.properties.LONG_NAME;
            delete feature.properties.MODE;

            feature.geometry.coordinates = feature.geometry.coordinates.filter((coordinate, index) => {
                if (index % 4 == 0 || index == feature.geometry.coordinates.length - 1) {
                    return true;
                } else {
                    const [x0, y0] = feature.geometry.coordinates[index-1];
                    const [x1, y1] = coordinate;
                    const [x2, y2] = feature.geometry.coordinates[index+1];
                    const [a0, a1] = [x0-x1, y0-y1];
                    const [b0, b1] = [x2-x1, y2-y1];
                    const angle = Math.acos((a0*b0 + a1*b1) / Math.sqrt((a0*a0 + a1*a1) * (b0*b0 + b1*b1)));
                    return angle < Math.PI * 2/3;
                }
            }).map((coordinate) => {
                return coordinate.map((ordinate) => {
                    return Math.round(ordinate*ROUNDER)/ROUNDER;
                })
            });
        }
    }
    console.log("Minified.");
    
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

    const busRoutes = JSON.stringify({
        type: "FeatureCollection",
        name: "busRoutes",
        features: busFeatures
    });

    console.log("Stringified.");
    
    console.log("Writing...");
    await fs.writeFile("../site/src/metroTrainRoutes.geojson", metroTrainRoutes);
    await fs.writeFile("../site/src/metroTramRoutes.geojson", metroTramRoutes);
    await fs.writeFile("../site/src/regionTrainRoutes.geojson", regionTrainRoutes);
    await fs.writeFile("../site/src/busRoutes.geojson", busRoutes);
    console.log("Written.");
})();
