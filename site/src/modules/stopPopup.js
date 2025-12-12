import { setRoutes, addRoutes, filterRoutes } from "./routeFilters.js";
import { timeString } from "./stringConverters.js";

function createStopPopup(stopMap, routeMaps, stopById, map) {
    const { stopId, stopName, stopMarker } = stopMap;

    const stopPopup = document.createElement("div");
    stopPopup.style.textAlign = "center";
    
    const header = document.createElement("h3");
    header.textContent = stopName;

    if ("streamLink" in stopMap) {
        const stream = document.createElement("a");
        stream.textContent = "📺";
        stream.title = "Go to webcam livestream...";
        stream.className = "nonbutton";
        stream.href = stopMap.streamLink;

        header.textContent += " ";
        header.appendChild(stream);
    }

    stopPopup.appendChild(header);
    
    const routesHeading = document.createElement("h4");
    if (stopMap.isStation()) {
        routesHeading.textContent = "Lines";
    } else {
        routesHeading.textContent = "Routes";
    }
    stopPopup.appendChild(routesHeading);
    
    const routesList = document.createElement("p");
    routesList.style.marginTop = 0;
    
    for (const routeMap of stopMap.routeMaps) {
        const routeItem = document.createElement("span");
        routeItem.textContent = routeMap.routeShortName;
        routeItem.style.backgroundColor = routeMap.routeColour;
        routeItem.style.color = routeMap.routeTextColour;
        routeItem.style.whiteSpace = "nowrap";
        routesList.appendChild(routeItem);
        
        routesList.appendChild(document.createTextNode(" "));
    }
    routesList.appendChild(document.createElement("br"));
    
    const setButton = document.createElement("button");
    setButton.textContent = "Set";
    setButton.addEventListener("click", () => {
        setRoutes(stopId, stopById, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(setButton);
    
    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.addEventListener("click", () => {
        addRoutes(stopId, stopById, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(addButton);
    
    const filterButton = document.createElement("button");
    filterButton.textContent = "Filter";
    filterButton.addEventListener("click", () => {
        filterRoutes(stopId, stopById, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(filterButton);
    
    stopPopup.appendChild(routesList);

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
    
    return stopPopup;
}

export { createStopPopup };