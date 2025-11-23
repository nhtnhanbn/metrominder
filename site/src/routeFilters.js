function setRoutes(stopId, stopById, routeMaps, map) {
    for (const routeMap of routeMaps) {
        routeMap.layerGroup.remove();
    }

    for (const routeMap of stopById[stopId].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function addRoutes(stopId, stopById, routeMaps, map) {
    for (const routeMap of stopById[stopId].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function filterRoutes(stopId, stopById, routeMaps, map) {
    for (const routeMap of routeMaps) {
        if (!stopById[stopId].routeMaps.has(routeMap)) {
            routeMap.layerGroup.remove();
        }
    }
}

export { setRoutes, addRoutes, filterRoutes };