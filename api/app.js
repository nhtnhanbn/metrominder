import express from "express";
import "dotenv/config";
import cors from "cors";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { createHmac } from "crypto";

const PORT = process.env.PORT || 3000;

async function updateFeed(resource) {
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

let positionCache = { timestamp: 0 }, tripCache = { timestamp: 0};

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

app.use("/positions",
    cors(),
    async (req, res) => {
        if (Date.now() - positionCache.timestamp > 4000) {
            positionCache = {
                timestamp: Date.now(),
                feed: await updateFeed(
                    "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/metro/vehicle-positions"
                )
            };
        }
        
        res.json(positionCache);
    }
);

app.use("/trips",
    cors(),
    async (req, res) => {
        if (Date.now() - tripCache.timestamp > 8000) {
            tripCache = {
                timestamp: Date.now(),
                feed: await updateFeed(
                    "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/metro/trip-updates"
                )
            };
        }
        
        res.json(tripCache);
    }
);

app.use("/positions", (err, req, res, next) => {
    if ("feed" in positionCache) {
        res.json(positionCache);
        console.log(err);
    } else {
        next(err);
    }
});

app.use("/trips", (err, req, res, next) => {
    if ("feed" in tripCache) {
        res.json(tripCache);
        console.log(err);
    } else {
        next(err);
    }
});

app.use((err, req, res, next) => {
    res.status(500).send("Internal server error :(");
    console.log(err);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
