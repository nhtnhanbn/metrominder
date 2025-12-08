import express from "express";
import "dotenv/config";
import cors from "cors";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { createHmac } from "crypto";
import fs from "fs/promises";
import { parse } from "csv-parse/sync";

const PORT = process.env.PORT || 3000;

const metroTrainPositionCache = { timestamp: 0 }, metroTrainTripCache = { timestamp: 0, headsignByTripId: {} }, metroTrainAlertCache = { timestamp: 0 };
const metroTramPositionCache = { timestamp: 0 }, metroTramTripCache = { timestamp: 0, headsignByTripId: {} }, metroTramAlertCache = { timestamp: 0 };
const regionTrainPositionCache = { timestamp: 0 }, regionTrainTripCache = { timestamp: 0, headsignByTripId: {} };
const busPositionCache = { timestamp: 0 }, busTripCache = { timestamp: 0, headsignByTripId: {} };

let positionsByRouteId = {}, tripsByRouteId = {};
setInterval(() => {
    positionsByRouteId = {};
    for (const positionCache of [metroTrainPositionCache, metroTramPositionCache, regionTrainPositionCache, busPositionCache]) {
        if ("feed" in positionCache && "entity" in positionCache.feed) {
            for (const vehicle of positionCache.feed.entity) {
                const routeId = vehicle.vehicle.trip.routeId;

                if (!(routeId in positionsByRouteId)) {
                    positionsByRouteId[routeId] = [];
                }

                positionsByRouteId[routeId].push(vehicle);
            }
        }
    }

    tripsByRouteId = {};
    for (const tripCache of [metroTrainTripCache, metroTramTripCache, regionTrainTripCache, busTripCache]) {
        if ("feed" in tripCache && "entity" in tripCache.feed) {
            for (const trip of tripCache.feed.entity) {
                const routeId = trip.tripUpdate.trip.routeId;

                if (!(routeId in tripsByRouteId)) {
                    tripsByRouteId[routeId] = [];
                }

                tripsByRouteId[routeId].push(trip);
            }
        }
    }
}, 1000);

const routeIdByTripId = {}, headsignByTripId = {}, busRouteIdByRouteCode = {};
(async () => {
    for (let number = 1; number <= 4; number++) {
        const rawTripData = await fs.readFile(`../data/gtfsschedule/${number}/trips.txt`);
        const tripData = parse(rawTripData, { bom: true, columns: true });
        for (const tripDatum of tripData) {
            const routeId = tripDatum.route_id;

            routeIdByTripId[tripDatum.trip_id] = routeId;
            headsignByTripId[tripDatum.trip_id] = tripDatum.trip_headsign;

            if (number === 4) {
                busRouteIdByRouteCode[routeId.slice(routeId.indexOf("-")+1, routeId.indexOf("-aus"))] = routeId;
            }
        }
    }
})();

const geojsonByModeRouteCode = {};
(async () => {
    for (const mode of ["metroTrain", "metroTram", "regionTrain", "bus"]) {
        geojsonByModeRouteCode[mode] = {};

        const response = await fs.readFile(`../data/${mode}Routes.geojson`);
        const data = JSON.parse(response);
        for (const feature of data.features) {
            const routeCode = feature.properties.SHORT_NAME;
            if (!(routeCode in geojsonByModeRouteCode[mode])) {
                geojsonByModeRouteCode[mode][routeCode] = [];
            }
            geojsonByModeRouteCode[mode][routeCode].push(feature);
        }
    }
})();

async function getFeed(resource) {
    const response = await fetch(
        resource,
        {
            headers: {
                "KeyId": process.env.DTP_API_KEY
            }
        }
    );
    
    if (!response.ok) {
        const error = new Error(
            `${response.url}: ${response.status} ${response.statusText}`
        );
        error.response = response;
        throw error;
    }
    
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
    );
    
    return feed;
}

async function updateCache(cache, endpoint) {
    try {
        cache.feed = await getFeed(`https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/${endpoint}`);

        if ("headsignByTripId" in cache) {
            cache.headsignByTripId = {};
            for (const entity of cache.feed.entity) {
                cache.headsignByTripId[entity.id] = headsignByTripId[entity.id];
            }
        }

        for (const entity of cache.feed.entity) {
            if (entity.vehicle) {
                entity.vehicle.trip.routeId = routeIdByTripId[entity.id];
            } else if (entity.tripUpdate) {
                entity.tripUpdate.trip.routeId = routeIdByTripId[entity.id];
            }
        }

        cache.timestamp = Date.now();
    } catch (error) {
        console.log(error);
    }
}

function routeCodeToId(mode, routeCode) {
    let routeId;
    switch (mode.toLowerCase()) {
        case "metrotrain":
            routeId = `aus:vic:vic-02-${routeCode}:`;
            break;
        case "regiontrain":
            routeId = `aus:vic:vic-01-${routeCode}:`;
            break;
        case "metrotram":
            routeId = `aus:vic:vic-03-${routeCode}:`;
            break;
        case "bus":
            routeId = busRouteIdByRouteCode[routeCode];
            break;
    }
    return routeId;
}

function handleError(err, res, next, cache) {
    if ("feed" in cache) {
        res.json(cache);
        console.log(err);
    } else {
        next(err);
    }
}

setInterval(() => {
    updateCache(metroTrainPositionCache, "metro/vehicle-positions");
}, 4000);

setInterval(() => {
    updateCache(metroTrainTripCache, "metro/trip-updates");
}, 8000);

setInterval(() => {
    updateCache(metroTrainAlertCache, "metro/service-alerts");
}, 60000);

setInterval(() => {
    updateCache(metroTramPositionCache, "tram/vehicle-positions");
}, 4000);

setInterval(() => {
    updateCache(metroTramTripCache, "tram/trip-updates");
}, 8000);

setInterval(() => {
    updateCache(metroTramAlertCache, "tram/service-alerts");
}, 60000);

setInterval(() => {
    updateCache(regionTrainPositionCache, "vline/vehicle-positions");
}, 4000);

setInterval(() => {
    updateCache(regionTrainTripCache, "vline/trip-updates");
}, 8000);

setInterval(() => {
    updateCache(busPositionCache, "bus/vehicle-positions");
}, 4000);

setInterval(() => {
    updateCache(busTripCache, "bus/trip-updates");
}, 8000);

const app = express();

app.use("/routes/:route_type",
    cors(),
    async(req, res) => {
        const url = `/v3/routes?route_types=${req.params.route_type}&devid=${process.env.PTV_API_DEVID}`;
        const hmac = createHmac("sha1", process.env.PTV_API_KEY);
        hmac.update(url);
        const signature = hmac.digest("hex").toUpperCase();
        const response = await fetch(`https://timetableapi.ptv.vic.gov.au${url}&signature=${signature}`);
        const feed = await response.json();
        res.send(feed);
    }
);

app.use("/stops/:route_id/:route_type",
    cors(),
    async(req, res) => {
        const { route_id, route_type } = req.params;
        const url = `/v3/stops/route/${route_id}/route_type/${route_type}?stop_disruptions=false&include_geopath=false&include_advertised_interchange=false&devid=${process.env.PTV_API_DEVID}`;
        const hmac = createHmac("sha1", process.env.PTV_API_KEY);
        hmac.update(url);
        const signature = hmac.digest("hex").toUpperCase();
        const response = await fetch(`https://timetableapi.ptv.vic.gov.au${url}&signature=${signature}`);
        const feed = await response.json();
        res.send(feed);
    }
);

app.use("/geojson",
    cors(),
    (req, res) => {
        const response = {};
        for (const mode in req.query) {
            let routeCodes = req.query[mode];
            if (!Array.isArray(routeCodes)) {
                routeCodes = [routeCodes];
            }

            response[mode] = {};
            for (const routeCode of routeCodes) {
                response[mode][routeCode] = mode in geojsonByModeRouteCode ? geojsonByModeRouteCode[mode][routeCode] : [];
            }
        }
        res.json(response);
    }
);

app.use("/positions",
    cors(),
    (req, res) => {
        const response = {
            timestamp: metroTrainPositionCache.timestamp,
            feed: {
                entity: []
            }
        };

        for (const mode in req.query) {
            let routeCodes = req.query[mode];
            if (!Array.isArray(routeCodes)) {
                routeCodes = [routeCodes];
            }

            for (const routeCode of routeCodes) {
                const routeId = routeCodeToId(mode, routeCode);
                if (routeId in positionsByRouteId) {
                    response.feed.entity.push(...positionsByRouteId[routeId]);
                }
            }
        }
        res.json(response);
    }
);

app.use("/trips",
    cors(),
    (req, res) => {
        const response = {
            feed: {
                header: {
                    timestamp: metroTrainTripCache.feed.header.timestamp.toInt()
                },
                entity: []
            },
            headsignByTripId: {}
        };

        for (const mode in req.query) {
            let routeCodes = req.query[mode];
            if (!Array.isArray(routeCodes)) {
                routeCodes = [routeCodes];
            }

            for (const routeCode of routeCodes) {
                const routeId = routeCodeToId(mode, routeCode);
                if (routeId in tripsByRouteId) {
                    const trips = tripsByRouteId[routeId];
                    response.feed.entity.push(...trips);

                    for (const trip of trips) {
                        response.headsignByTripId[trip.id] = headsignByTripId[trip.id];
                    }
                }
            }
        }
        res.json(response);
    }
);

app.use("/metrotrain/positions",
    cors(),
    (req, res) => {
        res.json(metroTrainPositionCache);
    }
);

app.use("/metrotrain/trips",
    cors(),
    (req, res) => {
        res.json(metroTrainTripCache);
    }
);

app.use("/metrotrain/alerts",
    cors(),
    (req, res) => {
        res.json(metroTrainAlertCache);
    }
);

app.use("/metrotram/positions",
    cors(),
    (req, res) => {
        res.json(metroTramPositionCache);
    }
);

app.use("/metrotram/trips",
    cors(),
    (req, res) => {
        res.json(metroTramTripCache);
    }
);

app.use("/metrotram/alerts",
    cors(),
    (req, res) => {
        res.json(metroTramAlertCache);
    }
);

app.use("/regiontrain/positions",
    cors(),
    (req, res) => {
        res.json(regionTrainPositionCache);
    }
);

app.use("/regiontrain/trips",
    cors(),
    (req, res) => {
        res.json(regionTrainTripCache);
    }
);

app.use("/bus/positions",
    cors(),
    (req, res) => {
        res.json(busPositionCache);
    }
);

app.use("/bus/trips",
    cors(),
    (req, res) => {
        res.json(busTripCache);
    }
);

app.use("/metrotrain/positions", (err, req, res, next) => {
    handleError(err, res, next, metroTrainPositionCache);
});

app.use("/metrotrain/trips", (err, req, res, next) => {
    handleError(err, res, next, metroTrainTripCache);
});

app.use("/metrotram/positions", (err, req, res, next) => {
    handleError(err, res, next, metroTramPositionCache);
});

app.use("/metrotram/trips", (err, req, res, next) => {
    handleError(err, res, next, metroTramTripCache);
});

app.use("/regiontrain/positions", (err, req, res, next) => {
    handleError(err, res, next, regionTrainPositionCache);
});

app.use("/regiontrain/trips", (err, req, res, next) => {
    handleError(err, res, next, regionTrainTripCache);
});

app.use("/bus/positions", (err, req, res, next) => {
    handleError(err, res, next, busPositionCache);
});

app.use("/bus/trips", (err, req, res, next) => {
    handleError(err, res, next, busTripCache);
});

app.use((err, req, res, next) => {
    res.status(500).send("Internal server error :(");
    console.log(err);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
