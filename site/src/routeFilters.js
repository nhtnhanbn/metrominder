function setRoutes(stopName, stopByName, routeMaps, map) {
    for (const routeMap of routeMaps) {
        routeMap.layerGroup.remove();
    }

    for (const routeMap of stopByName[stopName].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function addRoutes(stopName, stopByName, routeMaps, map) {
    for (const routeMap of stopByName[stopName].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function filterRoutes(stopName, stopByName, routeMaps, map) {
    for (const routeMap of routeMaps) {
        if (!stopByName[stopName].routeMaps.has(routeMap)) {
            routeMap.layerGroup.remove();
        }
    }
}

export { setRoutes, addRoutes, filterRoutes };