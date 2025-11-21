import fs from "fs/promises";
import { shortName } from "../site/src/stringConverters.js";

(async () => {
    const route_type = parseInt(process.argv[2]);

    const routesResponse = await fetch(`http://localhost:3000/routes/${route_type}`);
    const routesData = await routesResponse.json();

    const stopRoutes = {};
    for (const { route_id, route_number, route_gtfs_id } of routesData.routes) {
        let routeCode;
        switch (route_type) {
            case 0:
            case 3:
                routeCode = route_gtfs_id.slice(-3);
                break;
            case 1:
            case 2:
                routeCode = route_number;
                break;
        }

        const stopsResponse = await fetch(`http://localhost:3000/stops/${route_id}/${route_type}`);
        const stopsData = await stopsResponse.json();

        stopRoutes[routeCode] = [];
        try {
        for (const { stop_name } of stopsData.stops) {
            stopRoutes[routeCode].push(shortName(stop_name));
        }
        } catch {
            console.log(stopsData);
        }
    }

    switch (route_type) {
        case 0:
            await fs.writeFile("./metroTrainStopRoutes.json", JSON.stringify(stopRoutes));
            break;
        case 1:
            await fs.writeFile("./metroTramStopRoutes.json", JSON.stringify(stopRoutes));
            break;
        case 2:
            await fs.writeFile("./busStopRoutes.json", JSON.stringify(stopRoutes));
            break;
        case 3:
            await fs.writeFile("./regionTrainStopRoutes.json", JSON.stringify(stopRoutes));
            break;
    }
})();