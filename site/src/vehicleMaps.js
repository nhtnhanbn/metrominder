class VehicleMap {
    constructor(tripId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo, vehicleMode) {
        this.tripId = tripId;
        this.routeCode = routeCode;
        this.vehicleModelCode = vehicleModelCode;
        this.vehicleMarker = vehicleMarker;
        this.vehicleLabel = vehicleLabel;
        this.vehicleLabelContent = vehicleLabelContent;
        this.vehicleConsistInfo = vehicleConsistInfo;
        this.vehicleMode = vehicleMode;
        this.live = true;
    }

    isTrain() {
        return this.vehicleMode === "metroTrain" || this.vehicleMode === "regionTrain";
    }
}
const vehicleMaps = new Set(), vehicleByTripId = {};

export { VehicleMap, vehicleMaps, vehicleByTripId };