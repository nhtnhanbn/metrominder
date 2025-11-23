import { setRoutes, addRoutes, filterRoutes } from "./routeFilters.js";

function createStopPopup(stopMap, routeMaps, stopById, map) {
    const { stopId, stopName, stopMarker } = stopMap;

    const stopPopup = document.createElement("div");
    stopPopup.style.textAlign = "center";
    
    const header = document.createElement("h3");
    header.textContent = stopName;
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
    
    return stopPopup;
}

export { createStopPopup };