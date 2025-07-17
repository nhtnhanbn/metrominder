class RouteMap {
    constructor(routeId, shapeIds, colour) {
        this.routeId = `aus:vic:vic-02-${routeId}:`;
        this.shapeIds = shapeIds.map((shapeId) => {
            return `2-${routeId}-vpt-${shapeId}`;
        });
    }
}

const routeMaps = {
    "Alamein": new RouteMap("ALM", ["1.12.H", "1.22.H"]),
    "Belgrave": new RouteMap("BEG", ["1.17.H", "1.28.H"]),
    "Cranbourne": new RouteMap("CBE", ["1.11.H", "1.1.R"]),
    "Craigieburn": new RouteMap("CGB", ["1.17.H", "1.21.H"]),
    "Frankston": new RouteMap("FKN", ["1.1.R"]),
    "Glen Waverley": new RouteMap("GWY", ["1.10.H", "1.12.H"]),
    "Hurstbridge": new RouteMap("HBE", ["1.19.H", "1.5.H"]),
    "Lilydale": new RouteMap("LIL", ["1.24.H", "1.101.H"]),
    "Mernda": new RouteMap("MDD", ["1.3.H", "1.10.H"]),
    "Pakenham": new RouteMap("PKM", ["1.10.H", "1.1.R"]),
    "Sandringham": new RouteMap("SHM", ["1.2.H"]),
    "Stony Point": new RouteMap("STY", ["1.2.H"]),
    "Sunbury": new RouteMap("SUY", ["1.2.H", "1.35.H"]),
    "Upfield": new RouteMap("UFD", ["1.10.H", "1.2.H"]),
    "Werribee": new RouteMap("WER", ["1.1.R", "1.15.R"]),
    "Williamstown": new RouteMap("WIL", ["1.1.R"]),
    "Flemington Racecourse": new RouteMap("RCE", ["1.1.R", "7.2.R"]),
    "City Circle": new RouteMap("CCL", ["41.1.H"])
};

export { routeMaps };
