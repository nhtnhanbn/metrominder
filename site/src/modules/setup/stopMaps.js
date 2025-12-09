class StopMap {
    constructor(stopId, stopName, stopLat, stopLon, hasPlatforms) {
        this.stopId = stopId;
        this.stopName = stopName;
        this.stopLat = stopLat;
        this.stopLon = stopLon;
        this.hasPlatforms = hasPlatforms;
        this.routeMaps = new Set();
        this.stopDepartures = [];
    }

    isStation() {
        return this.stopId[0] === 'v';
    }
}

const streamLinkByStopId = {
    "vic:rail:SUN": "https://sunshinerailcam.wongm.com",
    "vic:rail:SYR": "https://youtube.com/live/knY-8mJ8_8U"
};

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
        const { stop_id, stop_name, stop_lat, stop_lon, parent_station, platform_code } = stopDatum;
        
        platformById[stop_id] = platform_code || platformById[stop_id];
        
        if (parent_station === "") {
            const stopMap = new StopMap(stop_id, stop_name, stop_lat, stop_lon, platform_code !== undefined);
            if (stop_id in streamLinkByStopId) {
                stopMap.streamLink = streamLinkByStopId[stop_id];
            }

            stopMaps.add(stopMap);
            stopById[stop_id] = stopMap;
            stopByName[stop_name] = stopMap;
        } else {
            parentById[stop_id] = parent_station;
        }
    }

    for (let [stopId, parentId] of Object.entries(parentById)) {
        while (parentId in parentById) {
            parentId = parentById[parentId];
        }
        stopById[stopId] = stopById[parentId];
    }

    for (const stopMap of stopMaps) {
        stopById[stopMap.stopId] = stopByName[stopMap.stopName];
    }
    
    for (const routeMap of routeMaps) {
        for (const stopId of routeMap.stopIds) {
            if (stopId in stopById) {
                stopById[stopId].routeMaps.add(routeMap);
            }
        }
    }

    for (const stopMap of stopMaps) {
        if (stopMap.routeMaps.size === 0) {
            stopMaps.delete(stopMap);
        }
    }

    return { stopMaps, stopById, stopByName, platformById };
}

export { createStopStructures };