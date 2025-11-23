import { VehicleMap } from "./vehicleMaps.js";
import { timeString, shortName } from "./stringConverters.js";
import { createStopPopup } from "./stopPopup.js";

const URL = "https://api.metrominder.nhan.au";

function calculateBearing(fromLat, fromLon, toLat, toLon) {
    function toRad(deg) {
        return deg * Math.PI / 180;
    }

    fromLat = toRad(fromLat);
    fromLon = toRad(fromLon);
    toLat = toRad(toLat);
    toLon = toRad(toLon);

    const y = Math.sin(toLon-fromLon) * Math.cos(toLat);
    const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLon-fromLon);

    return Math.atan2(y, x) * 180 / Math.PI;
}

function createConsistInfo(mode, vehicle, routeId) {
    let vehicleConsistInfo = "", vehicleModelCode = "";
    if (mode === "metroTrain") {
        const consist = vehicle.vehicle.vehicle.id;
        const splitConsist = consist.split("-");
        let carCode = splitConsist.find((car) => {
            return car[car.length-1] === 'T';
        });
        
        let carCount, vehicleModelName;
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
        
        vehicleConsistInfo += `<p style="margin-bottom: 0">
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
    } else if (mode === "metroTram") {
        vehicleModelCode = vehicle.vehicle.vehicle.label;
        vehicleConsistInfo = `<p><b>${vehicleModelCode}-Class</b> ${vehicle.vehicle.vehicle.id}</p>`
    }
    
    return { vehicleConsistInfo, vehicleModelCode };
}

async function updatePositions(routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map, mode) {
    positionStatus.textContent = "Retrieving positions...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const response = await fetch(`${URL}/${mode}/positions`);
        const feed = await response.json();
        
        const oldVehicleMaps = new Set(vehicleMaps);
        vehicleMaps.clear();

        for (const vehicle of feed.feed.entity) {
            let { latitude, longitude, bearing } = vehicle.vehicle.position;
            const tripId = vehicle.vehicle.trip.tripId;
            const routeId = vehicle.vehicle.trip.routeId;
            const routeCode = routeById[routeId].routeCode;
            const vehicleTooltip = `Position at ${timeString(vehicle.vehicle.timestamp, true)}`;
            
            if (tripId in vehicleByTripId) {
                const vehicleMap = vehicleByTripId[tripId];

                if (bearing === undefined) {
                    const { lat, lng } = vehicleMap.vehicleMarker.getLatLng();
                    if (lat !== undefined && lng !== undefined && (latitude !== lat || longitude !== lng)) {
                        vehicleMap.bearing = calculateBearing(lat, lng, latitude, longitude);
                    }
                    
                    if ("bearing" in vehicleMap) {
                        bearing = vehicleMap.bearing;
                    } else if ("nextStopMap" in vehicleMap) {
                        const stopMap = vehicleMap.nextStopMap;
                        bearing = calculateBearing(latitude, longitude, stopMap.stopLat, stopMap.stopLon);
                    } else {
                        bearing = 0;
                    }
                }

                vehicleMap.vehicleMarker.setRotation(bearing)
                                        .slideTo([latitude, longitude]);
                vehicleMap.vehicleLabel.setTooltipContent(vehicleTooltip)
                                        .slideTo([latitude, longitude]);
                vehicleMaps.add(vehicleMap);
            } else {
                const { vehicleConsistInfo, vehicleModelCode } = createConsistInfo(mode, vehicle, routeId);
                
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
                            rotation: bearing || 0
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
        updatePositions(routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map, mode);
    }, 1000);
}

async function updateTrips(routeMaps, routeById, stopMaps, stopById, stopByName, vehicleByTripId, platformById, tripStatus, attributionPrefix, map, mode) {
    tripStatus.textContent = "Retrieving trip updates...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const response = await fetch(`${URL}/${mode}/trips`);
        const feed = await response.json();
        
        for (const stopMap of stopMaps) {
            stopMap.stopDepartures = [];
        }
        
        const tripUpdateTime = timeString(feed.feed.header.timestamp, true);
        for (const trip of feed.feed.entity) {
            const tripUpdate = trip.tripUpdate;
            const tripId = tripUpdate.trip.tripId;
            if (tripUpdate.trip.scheduleRelationship !== "CANCELED" && "stopTimeUpdate" in tripUpdate) {
                const routeId = tripUpdate.trip.routeId;
                const stopTimeUpdate = tripUpdate.stopTimeUpdate;
                const headsign = feed.headsignByTripId[tripId];
                let vehiclePopup = `<h3 style="background-color: ${routeById[routeId].routeColour}; color: ${routeById[routeId].routeTextColour};">
                                        Service to ${headsign}
                                    </h3>`;
                
                if (tripId in vehicleByTripId) {
                    vehiclePopup += vehicleByTripId[tripId].vehicleConsistInfo;
                }
                
                let future = false;
                for (const stop of stopTimeUpdate) {
                    const stopMap = stopById[stop.stopId];
                    const platform = platformById[stop.stopId] || "";
                    
                    if (stop.departure && stop.departure.time >= Math.floor(Date.now()/1000)) {
                        stopMap.stopDepartures.push({
                            routeMap: routeById[routeId],
                            headsign: headsign,
                            platform: platform,
                            time: stop.departure.time
                        });
                    }
                    
                    if (tripId in vehicleByTripId && stop.arrival) {
                        const stopName = shortName(stopMap.stopName);
                        const stopTime = timeString(stop.arrival.time);
                        
                        if (future) {
                            vehiclePopup += `<tr>
                                                 <td style="text-align: left;">${stopName}</td>
                                                 ${ mode === "metroTrain" ? `<td>${platform}</td>` : "" }
                                                 <td>${stopTime}</td>
                                             </tr>`;
                        } else if (stop.arrival.time >= Math.floor(Date.now()/1000)) {
                            vehicleByTripId[tripId].nextStopMap = stopMap;
                            vehiclePopup += `<table>
                                                 <tr>
                                                     <th style="text-align: left;">ARRIVING</td>
                                                     ${ mode === "metroTrain" ? `<th>PLATFORM</td>` : "" }
                                                     <th>TIME</td>
                                                 </tr>
                                                 <tr>
                                                     <th style="text-align: left;">${stopName}</td>
                                                     ${ mode === "metroTrain" ? `<th>${platform}</td>` : "" }
                                                     <th>${stopTime}</td>
                                                 </tr>`;
                            future = true;
                        }
                    }
                }
                vehiclePopup += `</table> <p>Trip update ${tripUpdateTime}</p>`;
                
                if (tripId in vehicleByTripId) {
                    vehicleByTripId[tripId].vehicleLabel.setPopupContent(vehiclePopup);
                }
            }
        }
        
        for (const stopMap of stopMaps) {
            const stopMarker = stopMap.stopMarker;
            const stopPopup = createStopPopup(stopMap, routeMaps, stopByName, map, mode);
            
            const stopDepartures = stopMap.stopDepartures;
            if (stopDepartures.length > 0) {
                stopDepartures.sort((a, b) => {
                    return parseInt(a.time) - parseInt(b.time);
                });
                
                const table = document.createElement("table");
                
                const header = document.createElement("tr");
                const columns = mode === "metroTrain" ? ["DEPARTING", "PLATFORM", "TIME"] : ["DEPARTING", "TIME"];
                for (const column of columns) {
                    const cell = document.createElement("th");
                    cell.textContent = column;
                    header.appendChild(cell);
                }
                table.appendChild(header);
                
                for (const stopDeparture of stopDepartures) {
                    const row = document.createElement("tr");
                    
                    const serviceCell = document.createElement("td");
                    if (mode === "metroTrain") {
                        serviceCell.textContent = stopDeparture.headsign;
                    } else if (mode === "metroTram") {
                        serviceCell.textContent = `${stopDeparture.routeMap.routeShortName} ${stopDeparture.headsign}`;
                    }
                    serviceCell.style.backgroundColor = stopDeparture.routeMap.routeColour;
                    serviceCell.style.color = stopDeparture.routeMap.routeTextColour;
                    row.appendChild(serviceCell);
                    
                    if (mode === "metroTrain") {
                        const platformCell = document.createElement("td");
                        platformCell.textContent = stopDeparture.platform;
                        row.appendChild(platformCell);
                    }
                    
                    const timeCell = document.createElement("td");
                    timeCell.textContent = timeString(stopDeparture.time);
                    row.appendChild(timeCell);
                    
                    table.appendChild(row);
                }
                stopPopup.appendChild(table);
            } else {
                const text = document.createElement("div");
                text.textContent = "No departing services.";
                stopPopup.appendChild(text);
            }
            
            const updateTime = document.createElement("p");
            updateTime.textContent = `Trip updates ${tripUpdateTime}`;
            stopPopup.appendChild(updateTime);
            
            stopMarker.setPopupContent(stopPopup);
        }
        
        tripStatus.textContent = "";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    } catch (error) {
        console.log(error);
        
        tripStatus.textContent = "Failed to retrieve trip updates.";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    }
    
    setTimeout(() => {
        updateTrips(routeMaps, routeById, stopMaps, stopById, stopByName, vehicleByTripId, platformById, tripStatus, attributionPrefix, map, mode);
    }, 1000);
};

export { updatePositions, updateTrips };