class MetroTrainRouteMap {
    constructor(routeCode, shapeIds) {
        this.routeCode = routeCode;
        this.routeId = `aus:vic:vic-02-${routeCode}:`;
        this.shapeIds = shapeIds.map((shapeId) => {
            return `2-${this.routeCode}-vpt-${shapeId}`;
        });
        this.geojson = [];
        this.stopIds = [];
    }
}
class RegionTrainRouteMap {
    constructor(routeCode, shapeIds) {
        this.routeCode = routeCode;
        this.routeId = `aus:vic:vic-01-${routeCode}:`;
        this.shapeIds = shapeIds.map((shapeId) => {
            return `1-${this.routeCode}-mjp-${shapeId}`;
        });
        this.geojson = [];
        this.stopIds = [];
    }
}

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
    new MetroTrainRouteMap("PKM", ["1.10.H", "1.1.R"]),
    new MetroTrainRouteMap("SHM", ["1.2.H"]),
    new MetroTrainRouteMap("STY", ["1.2.H"]),
    new MetroTrainRouteMap("SUY", ["1.2.H", "1.35.H"]),
    new MetroTrainRouteMap("UFD", ["1.10.H", "1.2.H"]),
    new MetroTrainRouteMap("WER", ["1.1.R", "1.15.R"]),
    new MetroTrainRouteMap("WIL", ["1.1.R"]),
    new MetroTrainRouteMap("RCE", ["1.1.R", "9.1.H"]),
    new MetroTrainRouteMap("CCL", ["42.1.H"])
]);

const regionTrainRouteMaps = new Set([
    new RegionTrainRouteMap("ABY", ["9.2.R"]),
    new RegionTrainRouteMap("ART", ["9.6.R"]),
    new RegionTrainRouteMap("BAT", ["9.7.H"]),
    new RegionTrainRouteMap("BDE", ["9.5.R"]),
    new RegionTrainRouteMap("BGO", ["10.1.H"]),
    new RegionTrainRouteMap("ECH", ["9.6.R"]),
    new RegionTrainRouteMap("GEL", ["10.1.H"]),
    new RegionTrainRouteMap("MBY", ["5.2.H"]),
    new RegionTrainRouteMap("SER", ["10.1.H"]),
    new RegionTrainRouteMap("SNH", ["9.9.R"]),
    new RegionTrainRouteMap("SWL", ["9.4.R"]),
    new RegionTrainRouteMap("TRN", ["9.9.R"]),
    new RegionTrainRouteMap("vPK", ["9.2.R"]),
    new RegionTrainRouteMap("WBL", ["9.5.R"]),
]);

export { metroTrainRouteMaps, regionTrainRouteMaps };