import "./leaflet-arrowcircle/src/L.ArrowCircle.js";
import { VehicleMap } from "./vehicleMaps.js";
import { timeString, shortName } from "./stringConverters.js";
import { createStopPopup } from "./stopPopup.js";

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

const nClassName = {
    "N451": "City of Portland",
    "N452": "Rural City of Wodonga",
    "N453": "City of Albury",
    "N456": "City of Colac",
    "N458": "City of Maryborough",
    "N459": "City of Echuca",
    "N460": "City of Castlemaine",
    "N462": "City of Shepparton",
    "N465": "City of Ballaarat",
    "N467": "City of Stawell",
    "N468": "City of Bairnsdale",
    "N471": "City of Benalla",
    "N474": "City of Traralgon"
};

const xt1Name = {
    1626: "Iramoo",
    1630: "Westernport",
    1633: "Flash",
    1636: "Melbourne Rocks",
    1637: "Croydon West",
    1663: "Don Corrie",
};

const platformTermByMode = {
    "metroTrain": "<th>PLATFORM</th>",
    "regionTrain": "<th>PLATFORM</th>",
    "metroTram": "",
    "bus": "<th>BAY</th>"
}

function createConsistInfo(mode, vehicle, routeId) {
    let vehicleConsistInfo = "", vehicleModelCode = "";

    if ("vehicle" in vehicle.vehicle) {
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
                    vehicleModelName = "Siemens Nexas";
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
        } else if (mode === "regionTrain") {
            const carCode = vehicle.vehicle.vehicle.id;
            let consist, carCount, vehicleModelName;
            vehicleConsistInfo += `<p style="margin-bottom: 0">
                                    <b>`;

            switch (carCode[0]) {
                case 'V':
                    vehicleModelName = "VLocity";
                    vehicleModelCode = "VLO";

                    const initial = carCode[1], offset = carCode.slice(-2), set = `VL${parseInt(`${parseInt(initial)-1}${offset}`)}`;
                    if (set === "VL9") {
                        consist = `${set} <i>Michelle Payne</i>: ${initial}1${offset}-${initial}3${offset}-${initial}2${offset}`;
                    } else {
                        consist = `${set}: ${initial}1${offset}-${initial}3${offset}-${initial}2${offset}`;
                    }

                    break;
                case 'N':
                    vehicleModelName = "N-Set";
                    vehicleModelCode = "N";
                    consist = `${carCode} <i>${nClassName[carCode]}</i>`;
                    break;
            }
            
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
        } else if (mode === "bus") {
            vehicleConsistInfo = `<p>${vehicle.vehicle.vehicle.id}</p>`;
            vehicleModelCode = routeId;
        }
    }
    
    return { vehicleConsistInfo, vehicleModelCode };
}

async function updatePositions(routeMaps, routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map) {
    positionStatus.textContent = "Retrieving positions...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        const params = new URLSearchParams();
        for (const routeMap of routeMaps) {
            if (map.hasLayer(routeMap.layerGroup)) {
                params.append(routeMap.mode, routeMap.routeCode);
            }
        }

        const response = await fetch(`${process.env.APIURL}/positions?${params}`);
        const feed = await response.json();

        const time = timeString(feed.timestamp/1000, true);
        dtpTime.textContent = ` last updated ${time}`;

        if ("entity" in feed.feed) for (const vehicle of feed.feed.entity) {
            let { latitude, longitude, bearing } = vehicle.vehicle.position;
            const tripId = vehicle.vehicle.trip.tripId;
            const routeId = vehicle.vehicle.trip.routeId;

            let mode;
            switch (tripId.slice(0, 2)) {
                case "01":
                    mode = "regionTrain";
                    break;
                case "02":
                    mode = "metroTrain";
                    break;
                case "03":
                    mode = "metroTram";
                    break;
                default:
                    mode = "bus";
                    break;
            }
            
            if (!(routeId in routeById)) {
                continue;
            }

            const routeCode = routeById[routeId].routeCode;
            const vehicleTooltip = `Position at ${timeString(vehicle.vehicle.timestamp, true)}`;
            
            if (tripId in vehicleByTripId) {
                const vehicleMap = vehicleByTripId[tripId];
                vehicleMap.live = true;

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
                
                vehicleMaps.add(new VehicleMap(tripId, routeCode, vehicleModelCode, vehicleMarker, vehicleLabel, vehicleLabelContent, vehicleConsistInfo, mode));
                
                routeById[routeId].layerGroup.addLayer(vehicleMarker).addLayer(vehicleLabel);
            }
        }
        
        for (const vehicleMap of vehicleMaps) {
            if (!(vehicleMap.live)) {
                vehicleMap.vehicleMarker.remove();
                vehicleMap.vehicleLabel.remove();
                delete vehicleByTripId[vehicleMap.tripId];
            } else {
                vehicleMap.live = false;
                vehicleByTripId[vehicleMap.tripId] = vehicleMap;
            }
        }
        
        positionStatus.textContent = "";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    } catch (error) {
        console.log(error);
        
        positionStatus.textContent = "Failed to retrieve positions.";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    }
    
    setTimeout(() => {
        updatePositions(routeMaps, routeById, vehicleMaps, vehicleByTripId, dtpTime, positionStatus, attributionPrefix, state, map);
    }, 1000);
}

async function updateTrips(routeMaps, routeById, stopMaps, stopById, vehicleByTripId, platformById, tripStatus, attributionPrefix, map) {
    tripStatus.textContent = "Retrieving trip updates...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    
    try {
        let tripUpdateTime;

        for (const stopMap of stopMaps) {
            stopMap.stopDepartures = [];
        }

        
        const params = new URLSearchParams();
        for (const routeMap of routeMaps) {
            if (map.hasLayer(routeMap.layerGroup)) {
                params.append(routeMap.mode, routeMap.routeCode);
            }
        }

        const response = await fetch(`${process.env.APIURL}/trips?${params}`);
        const feed = await response.json();
        
        tripUpdateTime = timeString(feed.feed.header.timestamp, true);
        if ("entity" in feed.feed) for (const trip of feed.feed.entity) {
            const tripUpdate = trip.tripUpdate;
            const tripId = tripUpdate.trip.tripId;

            let mode;
            switch (tripId.slice(0, 2)) {
                case "01":
                    mode = "regionTrain";
                    break;
                case "02":
                    mode = "metroTrain";
                    break;
                case "03":
                    mode = "metroTram";
                    break;
                default:
                    mode = "bus";
                    break;
            }

            const routeId = mode === "bus" ? tripId.slice(3, 6) : tripUpdate.trip.routeId;
            if (tripUpdate.trip.scheduleRelationship !== "CANCELED" && "stopTimeUpdate" in tripUpdate && routeId in routeById) {
                const stopTimeUpdate = tripUpdate.stopTimeUpdate;

                let headsign = feed.headsignByTripId[tripId];
                if (headsign === undefined) {
                    const lastStop = stopTimeUpdate[stopTimeUpdate.length-1];
                    const lastStopMap = stopById[lastStop.stopId];
                    if (lastStopMap.isStation()) {
                        headsign = shortName(lastStopMap.stopName);
                    } else {
                        headsign = lastStopMap.stopName;
                    }
                }

                let vehiclePopup = `<h3 style="background-color: ${routeById[routeId].routeColour}; color: ${routeById[routeId].routeTextColour};">
                                        Service to ${headsign}
                                    </h3>`;
                
                if (tripId in vehicleByTripId) {
                    vehiclePopup += vehicleByTripId[tripId].vehicleConsistInfo;
                }
                
                let future = false;
                for (const stop of stopTimeUpdate) {
                    const stopMap = stopById[stop.stopId];
                    const platform = (platformById[stop.stopId] || "").replace("Bay", "").trim();
                    
                    if (stop.departure && stop.departure.time >= Math.floor(Date.now()/1000)) {
                        stopMap.stopDepartures.push({
                            routeMap: routeById[routeId],
                            headsign: headsign,
                            platform: platform,
                            time: stop.departure.time
                        });
                    }
                    
                    if (tripId in vehicleByTripId && stop.arrival) {
                        const vehicleMap = vehicleByTripId[tripId];
                        const stopName = stopMap.isStation() ? shortName(stopMap.stopName) : stopMap.stopName;
                        const stopTime = timeString(stop.arrival.time);
                        
                        if (future) {
                            vehiclePopup += `<tr>
                                                <td style="text-align: left;">${stopName}</td>
                                                ${ vehicleMap.hasPlatforms() ? `<td>${platform}</td>` : "" }
                                                <td>${stopTime}</td>
                                            </tr>`;
                        } else if (stop.arrival.time >= Math.floor(Date.now()/1000)) {
                            vehicleMap.nextStopMap = stopMap;
                            vehiclePopup += `<table>
                                                <tr>
                                                    <th style="text-align: left;">ARRIVING</td>
                                                    ${platformTermByMode[vehicleMap.vehicleMode]}
                                                    <th>TIME</td>
                                                </tr>
                                                <tr>
                                                    <th style="text-align: left;">${stopName}</td>
                                                    ${ vehicleMap.hasPlatforms() ? `<th>${platform}</td>` : "" }
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
        
        for (const stopMap of stopMaps) if (map.hasLayer(stopMap.stopMarker)) {
            const stopMarker = stopMap.stopMarker;
            const stopPopup = createStopPopup(stopMap, routeMaps, stopById, map);
            
            const stopDepartures = stopMap.stopDepartures;
            if (stopDepartures.length > 0) {
                stopDepartures.sort((a, b) => {
                    return parseInt(a.time) - parseInt(b.time);
                });
                
                const table = document.createElement("table");
                
                const header = document.createElement("tr");

                let columns;
                if (stopMap.hasPlatforms || stopMap.isStation()) {
                    if (stopMap.isStation()) {
                        columns = ["DEPARTING", "PLATFORM", "TIME"];
                    } else {
                        columns = ["DEPARTING", "BAY", "TIME"];
                    }
                } else {
                    columns = ["DEPARTING", "TIME"];
                }

                for (const column of columns) {
                    const cell = document.createElement("th");
                    cell.textContent = column;
                    header.appendChild(cell);
                }
                table.appendChild(header);
                
                for (const stopDeparture of stopDepartures) {
                    const row = document.createElement("tr");
                    
                    const serviceCell = document.createElement("td");
                    if (stopMap.isStation()) {
                        serviceCell.textContent = stopDeparture.headsign;
                    } else {
                        serviceCell.textContent = `${stopDeparture.routeMap.routeShortName} ${stopDeparture.headsign}`;
                    }
                    serviceCell.style.backgroundColor = stopDeparture.routeMap.routeColour;
                    serviceCell.style.color = stopDeparture.routeMap.routeTextColour;
                    row.appendChild(serviceCell);
                    
                    if (stopMap.hasPlatforms || stopMap.isStation()) {
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
        updateTrips(routeMaps, routeById, stopMaps, stopById, vehicleByTripId, platformById, tripStatus, attributionPrefix, map);
    }, 1000);
};

async function updateAlerts(alertStatus, map, modes) {
    alertStatus.textContent = "Retrieving service alerts...";
    map.attributionControl.setPrefix(attributionPrefix.outerHTML);

    try {
        for (const mode of modes) if (["metroTrain", "metroTram"].includes(mode)) {
            const response = await fetch(`${process.env.APIURL}/${mode}/alerts`);
            const feed = await response.json();

            if ("entity" in feed.feed) for (const vehicle of feed.feed.entity) {
            }
        }

        alertStatus.textContent = "";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    } catch (error) {
        console.log(error);
        alertStatus.textContent = "Failed to retrieve service alerts.";
        map.attributionControl.setPrefix(attributionPrefix.outerHTML);
    }


    setTimeout(() => {
        updateAlerts(alertStatus, map, modes);
    }, 60000);
}

export { updatePositions, updateTrips };