import fs from "fs/promises";
import { parse } from "csv-parse/sync";

(async () => {
    const stopRoutes = {};
    
    for (let number = 1; number <= 4; number++) {
        const rawTrips = await fs.readFile(`./gtfsschedule/${number}/trips.txt`);
        const trips = parse(rawTrips, { bom: true, columns: true });
        const tripRoute = {};
        for (const trip of trips) {
            tripRoute[trip.trip_id] = number === 4 ? trip.route_id.slice(3, 6) : trip.route_id;
        }
        console.log(`Processed trips for ${number}.`)

        const rawRoutes = await fs.readFile(`./gtfsschedule/${number}/routes.txt`);
        const routes = parse(rawRoutes, { bom: true, columns: true });
        for (const route of routes) {
            stopRoutes[number === 4 ? route.route_short_name : route.route_id] = new Set();
        }
        console.log(`Processed routes for ${number}.`)
        
        const rawStopTimes = await fs.readFile(`./gtfsschedule/${number}/stop_times.txt`);
        const stopTimes = parse(rawStopTimes, { bom: true, columns: true });
        for (const stopTime of stopTimes) {
            const routeId = tripRoute[stopTime.trip_id];
            if (routeId in stopRoutes) {
                stopRoutes[routeId].add(stopTime.stop_id);
            }
        }
        console.log(`Processed stop times for ${number}.`)

        for (const route of routes) {
            const routeId = number === 4 ? route.route_short_name : route.route_id;
            stopRoutes[routeId] = Array.from(stopRoutes[routeId]);
        }
        console.log(`Arrayified for ${number}.`)
    }

    await fs.writeFile("./stopRoutes.json", JSON.stringify(stopRoutes));
})();