function setLines(stopName, stopByName, routeMaps, map) {
    for (const routeMap of routeMaps) {
        routeMap.layerGroup.remove();
    }

    for (const routeMap of stopByName[stopName].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function addLines(stopName, stopByName, routeMaps, map) {
    for (const routeMap of stopByName[stopName].routeMaps){
        routeMap.layerGroup.addTo(map);
    }
}

function filterLines(stopName, stopByName, routeMaps, map) {
    for (const routeMap of routeMaps) {
        if (!stopByName[stopName].routeMaps.has(routeMap)) {
            routeMap.layerGroup.remove();
        }
    }
}

export { setLines, addLines, filterLines };