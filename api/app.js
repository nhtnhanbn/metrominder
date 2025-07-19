import express from "express";
import "dotenv/config";
import cors from "cors";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const PORT = process.env.PORT || 3000;

async function updateFeed(resource) {
    const response = await fetch(
        resource,
        {
            headers: {
                "Ocp-Apim-Subscription-Key": process.env.DTP_API_KEY
            }
        }
    );
    
    if (!response.ok) {
        const error = new Error(
            `${response.url}: ${response.status} ${response.statusText}`
        );
        error.response = response;
        throw error;
        
        return;
    }
    
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
    );
    
    return feed;
}

let positionCache = { timestamp: 0 }, tripCache = { timestamp: 0};

const app = express();

app.use("/positions",
    cors(),
    async (req, res) => {
        if (Date.now() - positionCache.timestamp > 4000) {
            positionCache = {
                timestamp: Date.now(),
                feed: await updateFeed(
                    "https://data-exchange-api.vicroads.vic.gov.au/opendata/v1/gtfsr/metrotrain-vehicleposition-updates"
                )
            };
        }
        
        res.json(positionCache);
    }
);

app.use("/trips",
    cors(),
    async (req, res) => {
        if (Date.now() - tripCache.timestamp > 4000) {
            tripCache = {
                timestamp: Date.now(),
                feed: await updateFeed(
                    "https://data-exchange-api.vicroads.vic.gov.au/opendata/v1/gtfsr/metrotrain-tripupdates"
                )
            };
        }
        
        res.json(tripCache);
    }
);

app.use((err, req, res, next) => {
    res.status(500).send("Internal server error :(");
    console.log(err);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
