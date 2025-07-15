import express from "express";
import "dotenv/config";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const PORT = 3000;

const app = express();

app.use(async (req, res) => {
    const response = await fetch(
        "https://data-exchange-api.vicroads.vic.gov.au/opendata/v1/gtfsr/metrotrain-vehicleposition-updates",
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
    
    res.json(feed);
});

app.use((err, req, res, next) => {
    res.status(500).send("Internal server error :(");
    console.log(err);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
