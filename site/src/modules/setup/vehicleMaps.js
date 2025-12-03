class VehicleMap {
    constructor(tripId, routeId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo, vehicleIcon, vehicleMode) {
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
        this.live = true;
    }

    hasPlatforms() {
        return this.vehicleMode === "metroTrain" || this.vehicleMode === "regionTrain" || this.vehicleMode === "bus";
    }
}
const vehicleMaps = new Set(), vehicleByTripId = {};

export { VehicleMap, vehicleMaps, vehicleByTripId };