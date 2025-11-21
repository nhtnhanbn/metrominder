import { metroTrainRouteMaps } from "./routeMapsInitial.js";
import metroTrainRouteData from "../../data/gtfsschedule/2/routes.txt";
import metroTramRouteData from "../../data/gtfsschedule/3/routes.txt";
import metroTrainStopRoutes from "../../data/metroTrainStopRoutes.json";
import metroTramStopRoutes from "../../data/metroTramStopRoutes.json";
import metroTrainGeojson from "./metroTrainRoutes.geojson";
import metroTramGeojson from "./metroTramRoutes.geojson";

class MetroTramRouteMap {
    constructor(routeCode) {
        // routeCode same as short name
        this.routeCode = routeCode;
        this.routeId = `aus:vic:vic-03-${routeCode}:`;
        this.geojson = [];
    }
}

function createRouteStructures(mode) {
    let routeMaps, routeData;
    if (mode === "metroTrain") {
        routeMaps = metroTrainRouteMaps;
        routeData = metroTrainRouteData;
    } else if (mode === "metroTram") {
        routeMaps = new Set();
        routeData = metroTramRouteData;

        for (const routeDatum of routeData) {
            const routeCode = routeDatum.route_short_name;
            routeMaps.add(new MetroTramRouteMap(routeCode));
        }
    }

    const routeById = {}, routeByShortName = {};

    for (const routeMap of routeMaps) {
        routeById[routeMap.routeId] = routeMap;
    }

    for (const routeDatum of routeData) {
        if (routeDatum.route_id in routeById) {
            const routeMap = routeById[routeDatum.route_id];
            routeMap.routeShortName = routeDatum.route_short_name;
            routeMap.routeLongName = routeDatum.route_long_name;
            routeMap.routeColour = "#" + routeDatum.route_color;
            routeMap.routeTextColour = "#" + routeDatum.route_text_color;
        }
    }

    for (const routeMap of routeMaps) {
        routeByShortName[routeMap.routeShortName] = routeMap;
    }

    if (mode === "metroTrain") {
        for (const routeDatum of routeData) {
            if (routeDatum.route_id in routeById) {
                const routeMap = routeById[routeDatum.route_id];
                routeMap.stopIds = metroTrainStopRoutes[routeMap.routeId];
            }
        }
        for (const feature of metroTrainGeojson.features) {
            const routeMap = routeByShortName[feature.properties.SHORT_NAME];
            if (routeMap.shapeIds.includes(feature.properties.SHAPE_ID)) {
                routeMap.geojson.push(feature);
            }
        }
    } else if (mode === "metroTram") {
        for (const routeDatum of routeData) {
            if (routeDatum.route_id in routeById) {
                const routeMap = routeById[routeDatum.route_id];
                routeMap.stopIds = metroTramStopRoutes[routeMap.routeId];
            }
        }
        for (const feature of metroTramGeojson.features) {
            routeByShortName[feature.properties.SHORT_NAME].geojson.push(feature);
        }
    }

    return { routeMaps, routeById, routeByShortName };
}

export { createRouteStructures };
