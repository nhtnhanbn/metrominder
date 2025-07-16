class RouteMap {
    constructor(routeId, shapeIds, colour) {
        this.routeId = `aus:vic:vic-02-${routeId}:`;
        this.shapeIds = shapeIds.map((shapeId) => {
            return `2-${routeId}-vpt-${shapeId}`;
        });
        this.colour = colour;
    }
}

const routeMaps = {
    "Alamein": new RouteMap("ALM", ["1.12.H", "1.22.H"], "#152C6B"),
    "Belgrave": new RouteMap("BEG", ["1.17.H", "1.28.H"], "#152C6B"),
    "Cranbourne": new RouteMap("CBE", ["1.11.H", "1.1.R"], "#279FD5"),
    "Craigieburn": new RouteMap("CGB", ["1.17.H", "1.21.H"], "#FFBE00"),
    "Frankston": new RouteMap("FKN", ["1.1.R"], "#028430"),
    "Glen Waverley": new RouteMap("GWY", ["1.10.H", "1.12.H"], "#152C6B"),
    "Hurstbridge": new RouteMap("HBE", ["1.19.H", "1.5.H"], "#BE1014"),
    "Lilydale": new RouteMap("LIL", ["1.24.H", "1.101.H"], "#152C6B"),
    "Mernda": new RouteMap("MDD", ["1.3.H", "1.10.H"], "#BE1014"),
    "Pakenham": new RouteMap("PKM", ["1.10.H", "1.1.R"], "#279FD5"),
    "Sandringham": new RouteMap("SHM", ["1.2.H"], "#F178AF"),
    "Stony Point": new RouteMap("STY", ["1.2.H"], "#028430"),
    "Sunbury": new RouteMap("SUY", ["1.2.H", "1.35.H"], "#FFBE00"),
    "Upfield": new RouteMap("UFD", ["1.10.H", "1.2.H"], "#FFBE00"),
    "Werribee": new RouteMap("WER", ["1.1.R", "1.15.R"], "#028430"),
    "Williamstown": new RouteMap("WIL", ["1.1.R"], "#028430"),
    "Flemington Racecourse": new RouteMap("RCE", ["1.1.R", "7.2.R"], "#95979A"),
    "City Circle": new RouteMap("CCL", ["41.1.H"], "#95979A")
};

export { routeMaps };
