import fs from "fs/promises";
import { parse } from "csv-parse/sync";

async function getStopRoutes(number, filename) {
    const stopRoutes = {};
    
    const rawTrips = await fs.readFile(`./gtfsschedule/${number}/trips.txt`);
    const trips = parse(rawTrips, { bom: true, columns: true });
    const tripRoute = {};
    for (const trip of trips) {
        tripRoute[trip.trip_id] = trip.route_id;
    }
    console.log(`Processed trips for ${filename}.`)

    const rawRoutes = await fs.readFile(`./gtfsschedule/${number}/routes.txt`);
    const routes = parse(rawRoutes, { bom: true, columns: true });
    for (const route of routes) {
        stopRoutes[route.route_id] = new Set();
    }
    console.log(`Processed routes for ${filename}.`)
    
    const rawStopTimes = await fs.readFile(`./gtfsschedule/${number}/stop_times.txt`);
    const stopTimes = parse(rawStopTimes, { bom: true, columns: true });
    for (const stopTime of stopTimes) {
        stopRoutes[tripRoute[stopTime.trip_id]].add(stopTime.stop_id)
    }
    console.log(`Processed stop times for ${filename}.`)

    for (const route of routes) {
        stopRoutes[route.route_id] = Array.from(stopRoutes[route.route_id]);
    }
    console.log(`Arrayified for ${filename}.`)

    await fs.writeFile(filename, JSON.stringify(stopRoutes));

    console.log(`Written ${filename}.`)
}

getStopRoutes(1, "./regionTrainStopRoutes.json");
getStopRoutes(2, "./metroTrainStopRoutes.json");
getStopRoutes(3, "./metroTramStopRoutes.json");
getStopRoutes(4, "./busStopRoutes.json");