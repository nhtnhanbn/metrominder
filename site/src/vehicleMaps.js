class VehicleMap {
    constructor(tripId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo) {
        this.tripId = tripId;
        this.routeCode = routeCode;
        this.vehicleModelCode = vehicleModelCode;
        this.vehicleMarker = vehicleMarker;
        this.vehicleLabel = vehicleLabel;
        this.vehicleLabelContent = vehicleLabelContent;
        this.vehicleConsistInfo = vehicleConsistInfo;
    }
}
const vehicleMaps = new Set(), vehicleByTripId = {};

export { VehicleMap, vehicleMaps, vehicleByTripId };