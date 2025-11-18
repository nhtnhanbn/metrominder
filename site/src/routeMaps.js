class RouteMap {
    constructor(routeId, routeName, shapeIds) {
        this.routeId = `aus:vic:vic-02-${routeId}:`;
        this.routeName = routeName;
        this.shapeIds = shapeIds.map((shapeId) => {
            return `2-${routeId}-vpt-${shapeId}`;
        });
    }
}

const routeMaps = [
    new RouteMap("ALM", "Alamein", ["1.12.H", "1.22.H"]),
    new RouteMap("BEG", "Belgrave", ["1.17.H", "1.28.H"]),
    new RouteMap("CBE", "Cranbourne", ["1.11.H", "1.1.R"]),
    new RouteMap("CGB", "Craigieburn", ["1.17.H", "1.21.H"]),
    new RouteMap("FKN", "Frankston", ["1.1.R"]),
    new RouteMap("GWY", "Glen Waverley", ["1.10.H", "1.12.H"]),
    new RouteMap("HBE", "Hurstbridge", ["1.19.H", "1.5.H"]),
    new RouteMap("LIL", "Lilydale", ["1.24.H", "1.101.H"]),
    new RouteMap("MDD", "Mernda", ["1.3.H", "1.10.H"]),
    new RouteMap("PKM", "Pakenham", ["1.10.H", "1.1.R"]),
    new RouteMap("SHM", "Sandringham", ["1.2.H"]),
    new RouteMap("STY", "Stony Point", ["1.2.H"]),
    new RouteMap("SUY", "Sunbury", ["1.2.H", "1.35.H"]),
    new RouteMap("UFD", "Upfield", ["1.10.H", "1.2.H"]),
    new RouteMap("WER", "Werribee", ["1.1.R", "1.15.R"]),
    new RouteMap("WIL", "Williamstown", ["1.1.R"]),
    new RouteMap("RCE", "Flemington Racecourse", ["1.1.R", "7.2.R"]),
    new RouteMap("CCL", "City Circle", ["41.1.H"])
];

export { routeMaps };
