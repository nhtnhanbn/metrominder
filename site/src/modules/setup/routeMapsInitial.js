import { MetroTrainRouteMap, RegionTrainRouteMap } from "./routeMapClasses.js";

const metroTrainRouteMaps = new Set([
    new MetroTrainRouteMap("ALM", ["1.12.H", "1.22.H"]),
    new MetroTrainRouteMap("BEG", ["1.17.H", "1.28.H"]),
    new MetroTrainRouteMap("CBE", ["1.11.H", "1.1.R"]),
    new MetroTrainRouteMap("CGB", ["1.17.H", "1.21.H"]),
    new MetroTrainRouteMap("FKN", ["1.1.R"]),
    new MetroTrainRouteMap("GWY", ["1.10.H", "1.12.H"]),
    new MetroTrainRouteMap("HBE", ["1.19.H", "1.5.H"]),
    new MetroTrainRouteMap("LIL", ["1.24.H", "1.101.H"]),
    new MetroTrainRouteMap("MDD", ["1.3.H", "1.10.H"]),
    new MetroTrainRouteMap("PKM", ["1.10.H", "1.1.R", "28.29.H"]),
    new MetroTrainRouteMap("SHM", ["1.2.H"]),
    new MetroTrainRouteMap("STY", ["1.2.H"]),
    new MetroTrainRouteMap("SUY", ["1.2.H", "1.35.H", "28.19.R"]),
    new MetroTrainRouteMap("UFD", ["1.10.H", "1.2.H"]),
    new MetroTrainRouteMap("WER", ["1.1.R", "1.15.R"]),
    new MetroTrainRouteMap("WIL", ["1.1.R"]),
    new MetroTrainRouteMap("RCE", ["1.1.R", "28.9.R"]),
    new MetroTrainRouteMap("CCL", ["54.1.H"])
]);

const regionTrainRouteMaps = new Set([
    new RegionTrainRouteMap("ABY", ["9.2.R"]),
    new RegionTrainRouteMap("ART", ["9.1.H"]),
    new RegionTrainRouteMap("BAT", ["9.6.R"]),
    new RegionTrainRouteMap("BDE", ["9.3.R"]),
    new RegionTrainRouteMap("BGO", ["9.2.H"]),
    new RegionTrainRouteMap("ECH", ["9.2.R"]),
    new RegionTrainRouteMap("GEL", ["9.8.R"]),
    new RegionTrainRouteMap("MBY", ["9.4.R"]),
    new RegionTrainRouteMap("SER", ["11.1.H"]),
    new RegionTrainRouteMap("SNH", ["15.1.H"]),
    new RegionTrainRouteMap("SWL", ["9.3.R"]),
    new RegionTrainRouteMap("TRN", ["9.2.R"]),
    new RegionTrainRouteMap("vPK", ["18.2.R"]),
    new RegionTrainRouteMap("WBL", ["9.3.R"]),
]);

export { metroTrainRouteMaps, regionTrainRouteMaps };