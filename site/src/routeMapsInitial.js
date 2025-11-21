class MetroTrainRouteMap {
    constructor(routeCode, shapeIds) {
        this.routeCode = routeCode;
        this.routeId = `aus:vic:vic-02-${routeCode}:`;
        this.shapeIds = shapeIds.map((shapeId) => {
            return `2-${this.routeCode}-vpt-${shapeId}`;
        });
        this.geojson = []
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

export { metroTrainRouteMaps };