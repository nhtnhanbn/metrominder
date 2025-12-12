class VehicleMap {
    constructor(vehicleId, tripId, routeId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo, vehicleIcon, vehicleMode, timestamp) {
        this.vehicleId = vehicleId;
        this.tripId = tripId;
        this.routeId = routeId;
        this.routeCode = routeCode;
        this.vehicleModelCode = vehicleModelCode;
        this.vehicleMarker = vehicleMarker;
        this.vehicleLabel = vehicleLabel;
        this.vehicleLabelContent = vehicleLabelContent;
        this.vehicleConsistInfo = vehicleConsistInfo;
        this.vehicleIcon = vehicleIcon;
        this.vehicleMode = vehicleMode;
        this.timestamp = timestamp;
        this.live = true;
    }

    hasPlatforms() {
        return this.vehicleMode === "metroTrain" || this.vehicleMode === "regionTrain" || this.vehicleMode === "bus";
    }
}
const vehicleMaps = new Set(), vehicleById = {}, vehicleByTripId = {};

export { VehicleMap, vehicleMaps, vehicleById, vehicleByTripId };