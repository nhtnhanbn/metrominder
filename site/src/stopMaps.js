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

    isStation() {
        return this.stopId[0] === 'v';
    }
}

function createStopStructures(modes, routeMaps, stopDatas) {
    let stopData = [];
    for (const mode of modes) {
        if (mode === "metroTrain") {
            stopData.push(...stopDatas.metroTrainStopData);
        } else if (mode === "metroTram") {
            stopData.push(...stopDatas.metroTramStopData);
        } else if (mode === "regionTrain") {
            stopData.push(...stopDatas.regionTrainStopData);
        } else if (mode === "bus") {
            stopData.push(...stopDatas.busStopData);
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
        for (const stopId of routeMap.stopIds) {
            if (stopId in stopById) {
                stopById[stopId].routeMaps.add(routeMap);
            }
        }
    }

    return { stopMaps, stopById, stopByName, platformById };
}

export { createStopStructures };