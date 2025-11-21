import { metroTrainRouteMaps } from "./routeMapsInitial.js";
import metroTrainRouteData from "../../data/gtfsschedule/2/routes.txt";
import stationLines from "../../data/stationLines.json";



function createRouteStructures(mode) {
    let routeMaps, routeData;
    if (mode === "metroTrain") {
        routeMaps = metroTrainRouteMaps;
        routeData = metroTrainRouteData;
    }

    const routeById = {}, routeByName = {};

    for (const routeMap of routeMaps) {
        routeById[routeMap.routeId] = routeMap;
    }

    for (const routeDatum of routeData) {
        if (routeDatum.route_id in routeById) {
            const routeMap = routeById[routeDatum.route_id];
            routeMap.routeName = routeDatum.route_short_name;
            routeMap.routeColour = "#" + routeDatum.route_color;
            routeMap.routeTextColour = "#" + routeDatum.route_text_color;
            routeMap.stopNames = stationLines[routeMap.routeName];
        }
    }

    for (const routeMap of routeMaps) {
        routeByName[routeMap.routeName] = routeMap;
    }

    return { routeMaps, routeById, routeByName };
}

export { createRouteStructures };
