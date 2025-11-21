import stopData from "../../data/gtfsschedule/stops.txt";
import { routeMaps } from "./routeMaps.js";
import { shortName } from "./stringConverters.js";

class StopMap {
    constructor(stopId, stopName, stopLat, stopLon) {
        this.stopId = stopId;
        this.stopName = stopName;
        this.stopLat = stopLat;
        this.stopLon = stopLon;
        this.routeMaps = new Set();
        this.stopDepartures = [];
    }
}
const stopMaps = new Set(), stopById = {}, stopByName = {};

const parentById = {}, platformById = {};
for (const stopDatum of stopData) {
    let { stop_id, stop_name, stop_lat, stop_lon, parent_station, platform_code } = stopDatum;
    
    if (parent_station === "") {
        stop_name = shortName(stop_name);

        const stopMap = new StopMap(stop_id, stop_name, stop_lat, stop_lon);
        stopMaps.add(stopMap);
        stopById[stop_id] = stopMap;
        stopByName[stop_name] = stopMap;
    } else {
        parentById[stop_id] = parent_station;
        platformById[stop_id] = platform_code;
    }
}

for (let [stopId, parentId] of Object.entries(parentById)) {
    while (parentId in parentById) {
        parentId = parentById[parentId];
    }
    stopById[stopId] = stopById[parentId];
}

for (const routeMap of routeMaps) {
    for (const stopName of routeMap.stopNames) {
        stopByName[stopName].routeMaps.add(routeMap);
    }
}

export { stopMaps, stopById, stopByName, platformById };