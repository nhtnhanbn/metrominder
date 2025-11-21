import metroTrainRouteData from "../../data/gtfsschedule/2/routes.txt";
import stationLines from "../../data/stationLines.json";

class RouteMap {
    constructor(routeId, shapeIds) {
        this.routeId = `aus:vic:vic-02-${routeId}:`;
        this.shapeIds = shapeIds.map((shapeId) => {
            return `2-${routeId}-vpt-${shapeId}`;
        });
    }
}

function createRouteStructures(mode) {
    let routeData;
    if (mode === "metroTrain") {
        routeData = metroTrainRouteData;
    }

    const routeMaps = new Set([
        new RouteMap("ALM", ["1.12.H", "1.22.H"]),
        new RouteMap("BEG", ["1.17.H", "1.28.H"]),
        new RouteMap("CBE", ["1.11.H", "1.1.R"]),
        new RouteMap("CGB", ["1.17.H", "1.21.H"]),
        new RouteMap("FKN", ["1.1.R"]),
        new RouteMap("GWY", ["1.10.H", "1.12.H"]),
        new RouteMap("HBE", ["1.19.H", "1.5.H"]),
        new RouteMap("LIL", ["1.24.H", "1.101.H"]),
        new RouteMap("MDD", ["1.3.H", "1.10.H"]),
        new RouteMap("PKM", ["1.10.H", "1.1.R"]),
        new RouteMap("SHM", ["1.2.H"]),
        new RouteMap("STY", ["1.2.H"]),
        new RouteMap("SUY", ["1.2.H", "1.35.H"]),
        new RouteMap("UFD", ["1.10.H", "1.2.H"]),
        new RouteMap("WER", ["1.1.R", "1.15.R"]),
        new RouteMap("WIL", ["1.1.R"]),
        new RouteMap("RCE", ["1.1.R", "7.2.R"]),
        new RouteMap("CCL", ["41.1.H"])
    ]);

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
