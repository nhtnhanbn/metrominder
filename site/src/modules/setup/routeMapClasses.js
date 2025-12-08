class RouteMap {
    constructor(routeCode, routeId, mode) {
        this.routeCode = routeCode;
        this.routeId = routeId;
        this.mode = mode;
        this.geojson = [];
        this.stopIds = [];
    }
}

class MetroTrainRouteMap extends RouteMap {
    constructor(routeCode, shapeIds) {
        super(routeCode, `aus:vic:vic-02-${routeCode}:`, "metroTrain");
        this.shapeIds = shapeIds.map((shapeId) => {
            return `2-${this.routeCode}-vpt-${shapeId}`;
        });
    }
}
class RegionTrainRouteMap extends RouteMap {
    constructor(routeCode, shapeIds) {
        super(routeCode, `aus:vic:vic-01-${routeCode}:`, "regionTrain");
        this.shapeIds = shapeIds.map((shapeId) => {
            return `1-${this.routeCode}-mjp-${shapeId}`;
        });
    }
}

class MetroTramRouteMap extends RouteMap {
    constructor(routeCode) {
        // routeCode same as short name
        super(routeCode, `aus:vic:vic-03-${routeCode}:`, "metroTram");
    }
}

class BusRouteMap extends RouteMap {
    constructor(routeCode) {
        // routeCode same as short name
        super(routeCode, routeCode, "bus");
    }
}

export { MetroTrainRouteMap, RegionTrainRouteMap, MetroTramRouteMap, BusRouteMap };