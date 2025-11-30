import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

(async () => {
    const rawRoutes = await fs.readFile("./gtfsschedule/1/routes.txt");
    const routes = parse(rawRoutes, { bom: true, columns: true });
    for (const route of routes) {
        switch (route.route_id) {
            case "aus:vic:vic-01-ABY:":
                route.route_short_name = "Albury";
                break;
            case "aus:vic:vic-01-ART:":
                route.route_short_name = "Ararat";
                break;
            case "aus:vic:vic-01-BDE:":
                route.route_short_name = "Bairnsdale";
                break;
            case "aus:vic:vic-01-ECH:":
                route.route_short_name = "Echuca";
                break;
            case "aus:vic:vic-01-MBY:":
                route.route_short_name = "Maryborough";
                break;
            case "aus:vic:vic-01-SNH:":
                route.route_short_name = "Shepparton";
                break;
            case "aus:vic:vic-01-SWL:":
                route.route_short_name = "Swan Hill";
                break;
            case "aus:vic:vic-01-WBL:":
                route.route_short_name = "Warrnambool";
                break;
        }
    }

    const header = rawRoutes.toString().split("\n")[0];
    const newRoutes = stringify(
        routes,
        { quoted_string: true }
    );
    await fs.writeFile("./gtfsschedule/1/routes.txt", `${header}\n${newRoutes}`);
})();