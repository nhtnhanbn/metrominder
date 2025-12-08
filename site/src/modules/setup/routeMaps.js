import { MetroTramRouteMap, BusRouteMap } from "./routeMapClasses.js";
import { metroTrainRouteMaps, regionTrainRouteMaps } from "./routeMapsInitial.js";
import metroTrainRouteData from "../../../../data/gtfsschedule/2/routes.txt";
import metroTramRouteData from "../../../../data/gtfsschedule/3/routes.txt";
import regionTrainRouteData from "../../../../data/gtfsschedule/1/routes.txt";
import busRouteData from "../../../../data/gtfsschedule/4/routes.txt";
import stopRoutes from "../../../../data/stopRoutes.json";

function createRouteStructures(modes, geojsons) {
    const routeById = {}, routeByModeCode = {};

    let routeData = [], routeMaps = new Set();
    for (const mode of modes) {
        routeByModeCode[mode] = {};

        if (mode === "metroTrain") {
            routeData.push(...metroTrainRouteData);
            routeMaps = routeMaps.union(metroTrainRouteMaps);

            for (const routeMap of metroTrainRouteMaps) {
                routeByModeCode[mode][routeMap.routeCode] = routeMap;
            }
        } else if (mode === "metroTram") {
            routeData.push(...metroTramRouteData);

            for (const routeDatum of metroTramRouteData.sort((a, b) => {
                return parseInt(a.route_short_name) - parseInt(b.route_short_name);
            })) {
                const routeCode = routeDatum.route_short_name;
                const routeMap = new MetroTramRouteMap(routeCode);
                routeMaps.add(routeMap);
                routeByModeCode[mode][routeCode] = routeMap;
            }
        } else if (mode === "regionTrain") {
            routeData.push(...regionTrainRouteData);
            routeMaps = routeMaps.union(regionTrainRouteMaps);

            for (const routeMap of regionTrainRouteMaps) {
                routeByModeCode[mode][routeMap.routeCode] = routeMap;
            }
        } else if (mode === "bus") {
            routeData.push(...busRouteData);

            for (const routeDatum of busRouteData.sort((a, b) => {
                return parseInt(a.route_short_name) - parseInt(b.route_short_name);
            })) {
                const routeMap = new BusRouteMap(routeDatum.route_id);
                routeMaps.add(routeMap);
                routeByModeCode[mode][routeMap.routeCode] = routeMap;
            }
        }
    }

    for (const routeMap of routeMaps) {
        routeById[routeMap.routeId] = routeMap;
    }

    for (const routeDatum of routeData) {
        const routeId = routeDatum.route_id;
        if (routeId in routeById) {
            const routeMap = routeById[routeId];
            routeMap.routeShortName = routeDatum.route_short_name;
            routeMap.routeLongName = routeDatum.route_long_name;
            routeMap.routeColour = "#" + routeDatum.route_color;
            routeMap.routeTextColour = "#" + routeDatum.route_text_color;
            routeMap.stopIds = stopRoutes[routeMap.routeId];
        }
    }

    for (const mode of modes) {
        if (mode === "metroTrain") {
            for (const feature of geojsons.metroTrainGeojson.features) {
                routeByModeCode[mode][feature.properties.SHORT_NAME].geojson.push(feature);
            }
        } else if (mode === "metroTram") {
            for (const feature of geojsons.metroTramGeojson.features) {
                routeByModeCode[mode][feature.properties.SHORT_NAME].geojson.push(feature);
            }
        } else if (mode === "regionTrain") {
            for (const feature of geojsons.regionTrainGeojson.features) {
                routeByModeCode[mode][feature.properties.SHORT_NAME].geojson.push(feature);
            }
        } else if (mode === "bus") {
            for (const feature of geojsons.busGeojson.features) {
                const routeCode = feature.properties.SHORT_NAME;
                if (routeCode in routeByModeCode[mode]) {
                    routeByModeCode[mode][routeCode].geojson.push(feature);
                }
            }
        }
    }

    return { routeMaps, routeById };
}

export { createRouteStructures };
