function timeString(seconds, displaySeconds = false) {
    const date = new Date(1000*seconds);
    
    return date.getHours().toString().padStart(2, "0") +
           ":" + date.getMinutes().toString().padStart(2, "0") +
           (displaySeconds ?
               ":" + date.getSeconds().toString().padStart(2, "0") :
               ""
           );
}

function shortName(stopName) {
    let sliceEnd = stopName.indexOf(" Railway Station");
    if (sliceEnd < 0) {
        sliceEnd = stopName.length;
    }

    return stopName.slice(0, sliceEnd)
                   .replace("Station", "")
                   .replace("Railway", "")
                   .replace("Rail Replacement Bus Stop", "")
                   .trim();
}

function busRouteCodeFromId(routeId) {
    return routeId.slice(routeId.indexOf("-")+1, routeId.indexOf("-aus"));
}

export { timeString, shortName, busRouteCodeFromId };
