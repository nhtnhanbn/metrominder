import { metroTrainRouteMaps, regionTrainRouteMaps } from "./routeMapsInitial.js";
import metroTrainRouteData from "../../data/gtfsschedule/2/routes.txt";
import metroTramRouteData from "../../data/gtfsschedule/3/routes.txt";
import regionTrainRouteData from "../../data/gtfsschedule/1/routes.txt";
import stopRoutes from "../../data/stopRoutes.json";
import metroTrainGeojson from "./metroTrainRoutes.geojson";
import metroTramGeojson from "./metroTramRoutes.geojson";
import regionTrainGeojson from "./regionTrainRoutes.geojson";

class MetroTramRouteMap {
    constructor(routeCode) {
        // routeCode same as short name
        this.routeCode = routeCode;
        this.routeId = `aus:vic:vic-03-${routeCode}:`;
        this.geojson = [];
    }
}

function createRouteStructures(modes) {
    let routeData = [], routeMaps = new Set();
    for (const mode of modes) {
        if (mode === "metroTrain") {
            routeData.push(...metroTrainRouteData);
            routeMaps = routeMaps.union(metroTrainRouteMaps);
        } else if (mode === "metroTram") {
            routeData.push(...metroTramRouteData);

            for (const routeDatum of routeData.sort((a, b) => {
                return a.route_short_name - b.route_short_name;
            })) {
                const routeCode = routeDatum.route_short_name;
                routeMaps.add(new MetroTramRouteMap(routeCode));
            }
        } else if (mode === "regionTrain") {
            routeData.push(...regionTrainRouteData);
            routeMaps = routeMaps.union(regionTrainRouteMaps);
        }
    }

    const routeById = {}, routeByCode = {};

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
            routeMap.stopIds = stopRoutes[routeMap.routeId];
        }
    }

    for (const routeMap of routeMaps) {
        routeByCode[routeMap.routeCode] = routeMap;
    }

    for (const mode of modes) {
        if (mode === "metroTrain") {
            for (const feature of metroTrainGeojson.features) {
                routeByCode[feature.properties.SHAPE_ID.slice(2, 5)].geojson.push(feature);
            }
        } else if (mode === "metroTram") {
            for (const feature of metroTramGeojson.features) {
                routeByCode[feature.properties.SHORT_NAME].geojson.push(feature);
            }
        } else if (mode === "regionTrain") {
            for (const feature of regionTrainGeojson.features) {
                routeByCode[feature.properties.SHAPE_ID.slice(2, 5)].geojson.push(feature);
            }
        }
    }

    return { routeMaps, routeById, routeByCode };
}

export { createRouteStructures };
