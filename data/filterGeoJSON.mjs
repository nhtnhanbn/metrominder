import fs from "fs/promises";
import { metroTrainRouteMaps, regionTrainRouteMaps } from "../site/src/modules/setup/routeMapsInitial.js";

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

    const fullTrainFeatures = JSON.parse(JSON.stringify(data.features.filter((feature) => {
        return (["METRO TRAIN", "REGIONAL TRAIN"].includes(feature.properties.MODE)) && feature.properties.SHORT_NAME !== "Replacement Bus";
    })));

    console.log("Filtered.");

    function cutCoords(coordinates) {
        return coordinates.filter((coordinate, index) => {
            if (index % 4 == 0 || index == coordinates.length - 1) {
                return true;
            } else {
                const [x0, y0] = coordinates[index-1];
                const [x1, y1] = coordinate;
                const [x2, y2] = coordinates[index+1];
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

            feature.geometry.coordinates = cutCoords(feature.geometry.coordinates);
        }
    }

    for (const feature of fullTrainFeatures) {
        delete feature.properties.HEADSIGN;
        delete feature.properties.LONG_NAME;
        delete feature.properties.SHORT_NAME;
        delete feature.properties.MODE;

        feature.geometry.coordinates = cutCoords(feature.geometry.coordinates);
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

    const fullTrainRoutes = JSON.stringify({
        type: "FeatureCollection",
        name: "fullTrainRoutes",
        features: fullTrainFeatures
    });

    console.log("Stringified.");
    
    console.log("Writing...");
    await fs.writeFile("./metroTrainRoutes.geojson", metroTrainRoutes);
    await fs.writeFile("./metroTramRoutes.geojson", metroTramRoutes);
    await fs.writeFile("./regionTrainRoutes.geojson", regionTrainRoutes);
    await fs.writeFile("./busRoutes.geojson", busRoutes);
    await fs.writeFile("./fullTrainRoutes.geojson", fullTrainRoutes);
    console.log("Written.");
})();
