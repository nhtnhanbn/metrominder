import "./leaflet-arrowcircle/src/L.ArrowCircle.js";
import { VehicleMap } from "./setup/vehicleMaps.js";
import { timeString, shortName } from "./stringConverters.js";
import { createStopPopup } from "./stopPopup.js";
import aIcon from "../static/a-b.svg";
import bIcon from "../static/a-b.svg";
import cIcon from "../static/c1.svg";
import comengIcon from "../static/comeng.svg";
import dIcon from "../static/d.svg";
import eIcon from "../static/e.svg";
import hcmtIcon from "../static/hcmt.svg";
import nIcon from "../static/n.svg";
import siemensIcon from "../static/siemens.svg";
import sprinterIcon from "../static/sprinter.svg";
import vlocityIcon from "../static/vlocity.svg";
import xt1Icon from "../static/xtrapolis.svg";
import zIcon from "../static/z3.svg";

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
    "1626T": "Iramoo",
    "1630T": "Westernport",
    "1633T": "Flash",
    "1636T": "Melbourne Rocks",
    "1637T": "Croydon West",
    "1663T": "Don Corrie",
    "1667T": "Barring"
};

const alstomTreadComengNumbers = [
    1011,
    1012,
    1013,
    1020,
    1021,
    1022,
    1025,
    1030,
    1032,
    1037,
    1038,
    1057,
    1058,
    1060,
    1080,
    1081,
    1084,
    1088,
    1090,
    1092,
    1094,
    1095,
    1096,
    1105,
    1112,
    1114,
    1117,
    1119,
    1196,
    1197,
    1198,
    1199
];

const platformTermByMode = {
    "metroTrain": "<th>PLATFORM</th>",
    "regionTrain": "<th>PLATFORM</th>",
    "metroTram": "",
    "bus": "<th>BAY</th>"
}

function createConsistInfo(mode, vehicle, routeId) {
    let vehicleConsistInfo = `<div class=consist-container>`, vehicleModelCode = "";

    if ("vehicle" in vehicle.vehicle) {
        if (mode === "metroTrain") {
            let consist = vehicle.vehicle.vehicle.id;
            const splitConsist = consist.split("-");
            let carCode = splitConsist.find((car) => {
                return car[car.length-1] === 'T';
            });
            
            let carCount, vehicleModelName;
            if (carCode) {
                carCount = splitConsist.length;
                
                const carNumber = parseInt(carCode.slice(0, -1));
                if (1000 <= carNumber && carNumber < 1200) {
                    if (alstomTreadComengNumbers.includes(carNumber) || (1131 <= carNumber && carNumber <= 1164) || (1166 <= carNumber && carNumber <= 1190)) {
                        vehicleModelName = "Alstom Comeng";
                        vehicleModelCode = "ACM";
                    } else {
                        vehicleModelName = "EDI Comeng";
                        vehicleModelCode = "ECM";
                    }
                    vehicleConsistInfo += `<img src=${comengIcon} class=popup-icon />`;
                } else if (2500 <= carNumber && carNumber < 2600) {
                    vehicleModelName = "Siemens Nexas";
                    vehicleModelCode = "SIE";
                    if (splitConsist.includes("2555T") || splitConsist.includes("2560T")) {
                        vehicleModelName += "</b> <i>Ride with Pride</i><b>";
                    }
                    vehicleConsistInfo += `<img src=${siemensIcon} class=popup-icon />`;
                } else if (1300 <= carNumber && carNumber < 1700) {
                    vehicleModelName = "X'Trapolis 100";
                    vehicleModelCode = "XT1";
                    for (const car of splitConsist) {
                        if (car in xt1Name) {
                            vehicleModelName += `</b> <i>${xt1Name[car]}</i><b>`;
                        }
                    }
                    vehicleConsistInfo += `<img src=${xt1Icon} class=popup-icon />`;
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
                    if (carNumber % 100 === 24) {
                        consist += " <i>Wurundjeri Biik</i>";
                    }
                    vehicleConsistInfo += `<img src=${hcmtIcon} class=popup-icon />`;
                } else if (7000 <= carNumber && carNumber < 7030) {
                    carCount = 1;
                    vehicleModelName = "Sprinter";
                    vehicleModelCode = "SPR";
                    vehicleConsistInfo += `<img src=${sprinterIcon} class=popup-icon />`;
                }
            }
            
            if ((!carCount || !vehicleModelName) && routeId === "aus:vic:vic-02-STY:") {
                carCount = 1;
                vehicleModelName = "Sprinter";
                vehicleModelCode = "SPR";
                vehicleConsistInfo += `<img src=${sprinterIcon} class=popup-icon />`;
            }
            
            vehicleConsistInfo += `<div>
                                       <p style="margin-bottom: 0">
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
                        </p>
                    </div>`;
        } else if (mode === "metroTram") {
            vehicleModelCode = vehicle.vehicle.vehicle.label;
            switch (vehicleModelCode[0]) {
                case 'A':
                    vehicleConsistInfo += `<img src=${aIcon} class=popup-icon />`;
                    break;
                case 'B':
                    vehicleConsistInfo += `<img src=${bIcon} class=popup-icon />`;
                    break;
                case 'C':
                    vehicleConsistInfo += `<img src=${cIcon} class=popup-icon />`;
                    break;
                case 'D':
                    vehicleConsistInfo += `<img src=${dIcon} class=popup-icon />`;
                    break;
                case 'E':
                    vehicleConsistInfo += `<img src=${eIcon} class=popup-icon />`;
                    break;
                case 'Z':
                    vehicleConsistInfo += `<img src=${zIcon} class=popup-icon />`;
                    break;
            }
            vehicleConsistInfo += `<p><b>${vehicleModelCode}-Class</b> ${vehicle.vehicle.vehicle.id}</p>`;
        } else if (mode === "regionTrain") {
            const carCode = vehicle.vehicle.vehicle.id;
            let consist, carCount, vehicleModelName;

            switch (carCode[0]) {
                case 'V':
                    vehicleModelName = "VLocity";
                    
                    const initial = carCode[1], offset = carCode.slice(-2), vehicleNumber = parseInt(`${parseInt(initial)-1}${offset}`);

                    if (76 <= vehicleNumber && vehicleNumber <= 79) {
                        vehicleModelCode = "VR";
                    } else if (93 <= vehicleNumber && vehicleNumber <= 98) {
                        vehicleModelCode = "VS";
                    } else {
                        vehicleModelCode = "VL";
                    }

                    const set = `${vehicleModelCode}${vehicleNumber}`;
                    if (set === "VL9") {
                        consist = `${set} <i>Michelle Payne</i>: ${initial}1${offset}-${initial}3${offset}-${initial}2${offset}`;
                    } else {
                        consist = `${set}: ${initial}1${offset}-${initial}3${offset}-${initial}2${offset}`;
                    }

                    vehicleConsistInfo += `<img src=${vlocityIcon} class=popup-icon />`;

                    break;
                case 'N':
                    vehicleModelName = "N-Set";
                    vehicleModelCode = "N";
                    consist = `${carCode} <i>${nClassName[carCode]}</i>`;
                    vehicleConsistInfo += `<img src=${nIcon} class=popup-icon />`;
                    break;
                default:
                    vehicleModelName = "Sprinter";
                    vehicleModelCode = "SPR";
                    consist = carCode;
                    vehicleConsistInfo += `<img src=${sprinterIcon} class=popup-icon />`;
            }
            
            vehicleConsistInfo += `<div>
                                       <p style="margin-bottom: 0">
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
                        </p>
                    </div>`;
        } else if (mode === "bus") {
            vehicleConsistInfo = `<p>${vehicle.vehicle.vehicle.id}</p>`;
            vehicleModelCode = routeId;
        }
    }

    vehicleConsistInfo += "</div>";
    
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
            switch (routeId.slice(0, 14)) {
                case "aus:vic:vic-01":
                    mode = "regionTrain";
                    break;
                case "aus:vic:vic-02":
                    mode = "metroTrain";
                    break;
                case "aus:vic:vic-03":
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
                        bearing = undefined;
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

        for (const stopMap of stopMaps) {
            if (map.hasLayer(stopMap.stopMarker)) {
                for (const routeMap of stopMap.routeMaps) {
                    if (!(params.has(routeMap.mode, routeMap.routeCode))) {
                        params.append(routeMap.mode, routeMap.routeCode);
                    }
                }
            }
        }

        const response = await fetch(`${process.env.APIURL}/trips?${params}`);
        const feed = await response.json();
        
        tripUpdateTime = timeString(feed.feed.header.timestamp, true);
        if ("entity" in feed.feed) for (const trip of feed.feed.entity) {
            const tripUpdate = trip.tripUpdate;
            const tripId = tripUpdate.trip.tripId;

            let mode;
            switch (tripUpdate.trip.routeId.slice(0, 14)) {
                case "aus:vic:vic-01":
                    mode = "regionTrain";
                    break;
                case "aus:vic:vic-02":
                    mode = "metroTrain";
                    break;
                case "aus:vic:vic-03":
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
                
                if (tripId in vehicleByTripId) {
                    const vehicleMap = vehicleByTripId[tripId];

                    let vehiclePopup = `<h3 style="background-color: ${routeById[routeId].routeColour}; color: ${routeById[routeId].routeTextColour};">
                                            Service to ${headsign}
                                        </h3>
                                        ${vehicleMap.vehicleConsistInfo}
                                        <table>
                                            <tr>
                                                <th style="text-align: left;">ARRIVING</td>
                                                ${platformTermByMode[vehicleMap.vehicleMode]}
                                                <th>TIME</td>
                                            </tr>`;
                    
                    let future = false;
                    for (const stop of stopTimeUpdate) {
                        const stopMap = stopById[stop.stopId];
                        const platform = (platformById[stop.stopId] || "").replace("Bay", "").trim();
                        const arrivalTime = parseInt("arrival" in stop ? stop.arrival.time : stop.departure.time);
                        const stopName = stopMap.isStation() ? shortName(stopMap.stopName) : stopMap.stopName;
                        const stopTime = timeString(arrivalTime);
                        
                        if (!future && arrivalTime + 60 >= Math.floor(Date.now()/1000)) {
                            vehicleMap.nextStopMap = stopMap;
                            vehiclePopup += `<tr>
                                                <th style="text-align: left;">${stopName}</td>
                                                ${ vehicleMap.hasPlatforms() ? `<th>${platform}</td>` : "" }
                                                <th>${stopTime}</td>
                                            </tr>`;
                            future = true;
                        } else {
                            vehiclePopup += `<tr>
                                                <td style="text-align: left;">${stopName}</td>
                                                ${ vehicleMap.hasPlatforms() ? `<td>${platform}</td>` : "" }
                                                <td>${stopTime}</td>
                                            </tr>`;
                        }
                    }
                    vehiclePopup += `</table> <p>Trip update ${tripUpdateTime}</p>`;
                    
                    vehicleByTripId[tripId].vehicleLabel.setPopupContent(vehiclePopup);
                }
                
                for (const stop of stopTimeUpdate) {
                    const stopMap = stopById[stop.stopId];
                    const platform = (platformById[stop.stopId] || "").replace("Bay", "").trim();
                    const departureTime = parseInt("departure" in stop ? stop.departure.time : stop.arrival.time);
                    if (departureTime + 60 >= Math.floor(Date.now()/1000)) {
                        stopMap.stopDepartures.push({
                            routeMap: routeById[routeId],
                            headsign: headsign,
                            platform: platform,
                            time: departureTime
                        });
                    }
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