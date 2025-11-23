import { setRoutes } from "./routeFilters.js";

function createMetroTrainLayerTree(routeMaps, routeByShortName, stopByName, vehicleMaps, stopLayer, state) {
    setInterval(() => {
        document.querySelector(
            `input[name=labels][value=${state.vehicleMarkerLabelSelection}]`
        ).checked = true;
    }, 0);

    const layerLeaves = {};
    for (const routeMap of routeMaps) {
        layerLeaves[routeMap.routeShortName] = {
            label: `<span style="background-color: ${routeMap.routeColour}; color: ${routeMap.routeTextColour};">
                        ${routeMap.routeShortName} line&nbsp
                    </span>`,
            layer: routeMap.layerGroup
        };
    }

    return [
        {
            label: "Train marker labels",
            children: [
                {
                    label: `<label title="Label train markers with line code">
                                <input class="marker-radio" type="radio" name="labels" value="route">
                                Line
                            </label>`,
                    eventedClasses: [{
                        className: "marker-radio",
                        event: "change",
                        selectAll: (ev, domNode, treeNode, map) => {
                            state.vehicleMarkerLabelSelection = "route";
                            for (const vehicleMap of vehicleMaps) {
                                vehicleMap.vehicleLabelContent.textContent = vehicleMap.routeCode;
                            }
                        }
                    }]
                },
                {
                    label: `<label title="Label train markers with type code">
                                <input class="marker-radio" type="radio" name="labels" value="model">
                                Type
                            </label>`,
                    eventedClasses: [{
                        className: "marker-radio",
                        event: "change",
                        selectAll: (ev, domNode, treeNode, map) => {
                            state.vehicleMarkerLabelSelection = "model";
                            for (const vehicleMap of vehicleMaps) {
                                vehicleMap.vehicleLabelContent.textContent = vehicleMap.vehicleModelCode;
                            }
                        }
                    }]
                }
            ]
        },
        {
            label: "Show stations",
            layer: stopLayer
        },
        {
            label: `<div class="leaflet-control-layers-separator"></div>`
        },
        {
            label: "<b>All lines<b>",
            selectAllCheckbox: true,
            children: [
                layerLeaves["Sandringham"],
                {
                    label: `<span style="background-color: #279FD5; color: black;">
                                Caulfield group
                            <span>
                            &nbsp`,
                    collapsed: true,
                    selectAllCheckbox: true,
                    children: [
                        layerLeaves["Cranbourne"],
                        layerLeaves["Pakenham"]
                    ]
                },
                {
                    label: `<span style="background-color: #BE1014; color: white;">
                                Clifton Hill group
                            </span>
                            &nbsp`,
                    collapsed: true,
                    selectAllCheckbox: true,
                    children: [
                        layerLeaves["Hurstbridge"],
                        layerLeaves["Mernda"]
                    ]
                },
                {
                    label: `<span style="background-color: #FFBE00; color: black;">
                                Northern group
                            </span>
                            &nbsp`,
                    collapsed: true,
                    selectAllCheckbox: true,
                    children: [
                        layerLeaves["Craigieburn"],
                        layerLeaves["Sunbury"],
                        layerLeaves["Upfield"]
                    ]
                },
                {
                    label: `<span style="background-color: #028430; color: white;">
                                Cross-city group
                            </span>
                            &nbsp`,
                    collapsed: true,
                    selectAllCheckbox: true,
                    children: [
                        layerLeaves["Frankston"],
                        layerLeaves["Stony Point"],
                        layerLeaves["Werribee"],
                        layerLeaves["Williamstown"]
                    ]
                },
                {
                    label: `<span style="background-color: #152C6B; color: white;">
                                Burnley group
                            </span>
                            &nbsp`,
                    collapsed: true,
                    selectAllCheckbox: true,
                    children: [
                        layerLeaves["Alamein"],
                        layerLeaves["Belgrave"],
                        layerLeaves["Glen Waverley"],
                        layerLeaves["Lilydale"]
                    ]
                },
                {
                    label: "Special services",
                    collapsed: true,
                    selectAllCheckbox: true,
                    children: [
                        layerLeaves["Flemington Racecourse"],
                        layerLeaves["City Circle"]
                    ]
                }
            ]
        },
        {
            label: "<b>Presets<b>",
            children: [
                {
                    label: `<button class="preset-button colour-button" title="Burnley, Clifton Hill, Caulfield and Northern groups and City Circle line" style="background: linear-gradient(to right, #152C6B 25%, #BE1014 25% 50%, #279FD5 50% 75%, #FFBE00 75%);">
                                City Loop
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("Melbourne Central", stopByName, routeMaps, map);
                            routeByShortName["Flemington Racecourse"].layerGroup.remove();
                        }
                    }]
                },
                {
                    label: `<button class="preset-button colour-button" title="Burnley, Cross-city (except Stony Point line) and Caulfield groups and Sandringham line" style="background: linear-gradient(to right, #152C6B 25%, #028430 25% 50%, #279FD5 50% 75%, #F178AF 75%);">
                                Richmond
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("Richmond", stopByName, routeMaps, map);
                            routeByShortName["Werribee"].layerGroup.addTo(map);
                            routeByShortName["Williamstown"].layerGroup.addTo(map);
                        }
                    }]
                },
                {
                    label: `<button class="preset-button colour-button" title="Cross-city (except Stony Point line) and Caulfield groups and Sandringham line" style="background: linear-gradient(to right, #028430 25%, #279FD5 25% 75%, #F178AF 75%);">
                                South Yarra
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("South Yarra", stopByName, routeMaps, map);
                            routeByShortName["Werribee"].layerGroup.addTo(map);
                            routeByShortName["Williamstown"].layerGroup.addTo(map);
                        }
                    }]
                },
                {
                    label: `<button class="preset-button colour-button" title="Cross-city (except Stony Point line) and Caulfield groups" style="background: linear-gradient(to right, #028430 50%, #279FD5 50%);">
                                Caulfield
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("Caulfield", stopByName, routeMaps, map);
                            routeByShortName["Werribee"].layerGroup.addTo(map);
                            routeByShortName["Williamstown"].layerGroup.addTo(map);
                        }
                    }]
                },
                {
                    label: `<button class="preset-button colour-button" title="Cross-city (except Stony Point line) and Northern groups" style="background: linear-gradient(to right, #028430 50%, #FFBE00 50%);">
                                North Melbourne
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("North Melbourne", stopByName, routeMaps, map);
                            routeByShortName["Frankston"].layerGroup.addTo(map);
                            routeByShortName["Flemington Racecourse"].layerGroup.remove();
                        }
                    }]
                },
                {
                    label: `<button class="preset-button colour-button" title="Cross-city (except Stony Point line) group and Sunbury line" style="background: linear-gradient(to right, #028430 75%, #FFBE00 25%);">
                                Footscray
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("Footscray", stopByName, routeMaps, map);
                            routeByShortName["Frankston"].layerGroup.addTo(map);
                        }
                    }]
                }
            ]
        }
    ];
}

export { createMetroTrainLayerTree };