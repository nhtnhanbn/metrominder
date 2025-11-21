import { setLines, addLines, filterLines } from "./lineFilters.js";

function createStopPopup(stopMap, routeMaps, stopByName, map) {
    const stopName = stopMap.stopName;
    const stopMarker = stopMap.stopMarker;

    const stopPopup = document.createElement("div");
    stopPopup.style.textAlign = "center";
    
    const header = document.createElement("h3");
    header.textContent = stopName;
    stopPopup.appendChild(header);
    
    const routesHeading = document.createElement("h4");
    routesHeading.textContent = "Lines";
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
        setLines(stopName, stopByName, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(setButton);
    
    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.addEventListener("click", () => {
        addLines(stopName, stopByName, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(addButton);
    
    const filterButton = document.createElement("button");
    filterButton.textContent = "Filter";
    filterButton.addEventListener("click", () => {
        filterLines(stopName, stopByName, routeMaps, map);
        stopMarker.closePopup();
    });
    routesList.appendChild(filterButton);
    
    stopPopup.appendChild(routesList);
    
    return stopPopup;
}

export { createStopPopup };