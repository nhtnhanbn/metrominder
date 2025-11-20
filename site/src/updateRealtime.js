import { VehicleMap } from "./vehicleMaps.js";
import { timeString } from "./timeString.js";

async function updatePositions(routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map) {
    positionStatus.textContent = "Retrieving positions...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const response = await fetch("https://api.metrominder.nhan.au/positions");
        const feed = await response.json();
        
        const oldVehicleMaps = new Set(vehicleMaps);
        vehicleMaps.clear();

        for (const vehicle of feed.feed.entity) {
            const { latitude, longitude, bearing } = vehicle.vehicle.position;
            const tripId = vehicle.vehicle.trip.tripId;
            const routeId = vehicle.vehicle.trip.routeId;
            const routeCode = routeId.slice(15, 18);
            const vehicleTooltip = `Position at ${timeString(vehicle.vehicle.timestamp, true)}`;
            const vehicleMap = vehicleByTripId[tripId];
            
            if (oldVehicleMaps.has(vehicleMap)) {
                vehicleMap.vehicleMarker.setRotation(bearing)
                                        .slideTo([latitude, longitude]);
                vehicleMap.vehicleLabel.setTooltipContent(vehicleTooltip)
                                        .slideTo([latitude, longitude]);
                vehicleMaps.add(vehicleMap);
            } else {
                const consist = vehicle.vehicle.vehicle.id;
                const splitConsist = consist.split("-");
                let carCode = splitConsist.find((car) => {
                    return car[car.length-1] === 'T';
                });
                
                let carCount, vehicleModelName, vehicleModelCode = "";
                if (carCode) {
                    carCount = splitConsist.length;
                    
                    const carNumber = parseInt(carCode.slice(0, -1));
                    if (1000 <= carNumber && carNumber < 1200) {
                        vehicleModelName = "Comeng";
                        vehicleModelCode = "COM";
                    } else if (2500 <= carNumber && carNumber < 2600) {
                        vehicleModelName = "Siemens";
                        vehicleModelCode = "SIE";
                    } else if (1300 <= carNumber && carNumber < 1700) {
                        vehicleModelName = "X'Trapolis 100";
                        vehicleModelCode = "XT1";
                    } else if (8100 <= carNumber && carNumber < 8900) {
                        vehicleModelName = "X'Trapolis 2.0";
                        vehicleModelCode = "XT2";
                    }
                } else if (splitConsist.length > 0) {
                    carCode = splitConsist[0];

                    const carNumber = parseInt(carCode.slice(0, -1));
                    if (9000 <= carNumber && carNumber < 10000) {
                        carCount = 7;
                        vehicleModelName = "High Capacity Metro Train";
                        vehicleModelCode = "HCM";
                    } else if (7000 <= carNumber && carNumber < 7030) {
                        carCount = 1;
                        vehicleModelName = "Sprinter";
                        vehicleModelCode = "SPR";
                    }
                }
                
                if ((!carCount || !vehicleModelName) && routeId === "aus:vic:vic-02-STY:") {
                    carCount = 1;
                    vehicleModelName = "Sprinter";
                    vehicleModelCode = "SPR";
                }
                
                let vehicleConsistInfo = `<p style="margin-bottom: 0">
                                       <b>`;
                
                if (carCount) {
                    vehicleConsistInfo += `${carCount}-car`;
                }
                
                if (vehicleModelName) {
                    vehicleConsistInfo += ` ${vehicleModelName}`;
                }
                
                vehicleConsistInfo += `</b>
                            </p>
                            <p style="margin-top: 0">
                                ${consist}
                            </p>`;
                
                const vehicleLabelContent = document.createElement("div");
                if (state.vehicleMarkerLabelSelection === "route") {
                    vehicleLabelContent.textContent = routeCode;
                } else {
                    vehicleLabelContent.textContent = vehicleModelCode;
                }
                vehicleLabelContent.style.color = routeById[routeId].routeTextColour;
                                 
                const vehicleMarker = L.marker.arrowCircle(
                    [latitude, longitude],
                    {
                        iconOptions: {
                            stroke: routeById[routeId].routeTextColour,
                            color: routeById[routeId].routeColour,
                            size: 40,
                            rotation: bearing
                        },
                        pane: "vehiclePane",
                        interactive: false,
                        rotateWithView: true
                    }
                );
                
                const vehicleLabel = L.marker(
                    [latitude, longitude],
                    {
                        icon: L.divIcon({
                            html: vehicleLabelContent,
                            tooltipAnchor: [9, 0],
                            className: "vehicle-label"
                        }),
                        pane: "vehiclePane"
                    }
                ).bindTooltip(
                    L.tooltip().setContent(vehicleTooltip)
                ).bindPopup(
                    vehicleConsistInfo + "No trip information.",
                    { autoPan: false }
                );
                
                vehicleMaps.add(new VehicleMap(tripId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo));
                
                routeById[routeId].layerGroup.addLayer(vehicleMarker).addLayer(vehicleLabel);
            }
        }
        
        for (const vehicleMap of oldVehicleMaps) {
            if (!(vehicleMaps.has(vehicleMap))) {
                vehicleMap.vehicleMarker.remove();
                vehicleMap.vehicleLabel.remove();
                delete vehicleByTripId[vehicleMap.tripId];
            }
        }

        for (const vehicleMap of vehicleMaps) {
            vehicleByTripId[vehicleMap.tripId] = vehicleMap;
        }
        
        const time = timeString(feed.timestamp/1000, true);
        dtpTime.textContent = ` last updated ${time}`;
        positionStatus.textContent = "";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    } catch (error) {
        console.log(error);
        
        positionStatus.textContent = "Failed to retrieve positions.";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    }
    
    setTimeout(() => {
        updatePositions(routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map);
    }, 1000);
}

export { updatePositions };