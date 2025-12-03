import { setRoutes } from "../routeFilters.js";

function createTrainLayerTree(routeMaps, routeById, stopById, vehicleMaps, stopLayer, state) {
    setInterval(() => {
        document.querySelector(
            `input[name=labels][value=${state.vehicleMarkerLabelSelection}]`
        ).checked = true;
    }, 0);

    const layerLeafByCode = {};
    for (const routeMap of routeMaps) {
        layerLeafByCode[routeMap.routeCode] = {
            label: `<span style="background-color: ${routeMap.routeColour}; color: ${routeMap.routeTextColour};">
                        ${routeMap.routeShortName} line&nbsp
                    </span>`,
            layer: routeMap.layerGroup
        };
    }

    const metroTrainTree = [
        layerLeafByCode["SHM"],
        {
            label: `<span style="background-color: #279FD5; color: black;">
                        Caulfield group
                    <span>
                    &nbsp`,
            collapsed: true,
            selectAllCheckbox: true,
            children: [
                layerLeafByCode["CBE"],
                layerLeafByCode["PKM"]
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
                layerLeafByCode["HBE"],
                layerLeafByCode["MDD"]
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
                layerLeafByCode["CGB"],
                layerLeafByCode["SUY"],
                layerLeafByCode["UFD"]
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
                layerLeafByCode["FKN"],
                layerLeafByCode["STY"],
                layerLeafByCode["WER"],
                layerLeafByCode["WIL"]
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
                layerLeafByCode["ALM"],
                layerLeafByCode["BEG"],
                layerLeafByCode["GWY"],
                layerLeafByCode["LIL"]
            ]
        },
        {
            label: "Special services",
            collapsed: true,
            selectAllCheckbox: true,
            children: [
                layerLeafByCode["RCE"],
                layerLeafByCode["CCL"]
            ]
        }
    ];

    const regionTrainTree = [
        {
            label: `<span style="background-color: #8F1A95; color: white;">
                        Ballarat group
                    </span>
                    &nbsp`,
            collapsed: true,
            selectAllCheckbox: true,
            children: [
                layerLeafByCode["ART"],
                layerLeafByCode["BAT"],
                layerLeafByCode["MBY"]
            ]
        },
        {
            label: `<span style="background-color: #8F1A95; color: white;">
                        Bendigo group
                    </span>
                    &nbsp`,
            collapsed: true,
            selectAllCheckbox: true,
            children: [
                layerLeafByCode["BGO"],
                layerLeafByCode["ECH"],
                layerLeafByCode["SWL"]
            ]
        },
        {
            label: `<span style="background-color: #8F1A95; color: white;">
                        Geelong group
                    </span>
                    &nbsp`,
            collapsed: true,
            selectAllCheckbox: true,
            children: [
                layerLeafByCode["GEL"],
                layerLeafByCode["WBL"]
            ]
        },
        {
            label: `<span style="background-color: #8F1A95; color: white;">
                        Gippsland group
                    </span>
                    &nbsp`,
            collapsed: true,
            selectAllCheckbox: true,
            children: [
                layerLeafByCode["BDE"],
                layerLeafByCode["TRN"],
                layerLeafByCode["vPK"]
            ]
        },
        {
            label: `<span style="background-color: #8F1A95; color: white;">
                        Seymour group
                    </span>
                    &nbsp`,
            collapsed: true,
            selectAllCheckbox: true,
            children: [
                layerLeafByCode["ABY"],
                layerLeafByCode["SER"],
                layerLeafByCode["SNH"]
            ]
        }
    ]

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
                },
                {
                    label: `<label title="Display train markers as train icons">
                                <input class="marker-radio" type="radio" name="labels" value="icon">
                                Icon
                            </label>`,
                    eventedClasses: [{
                        className: "marker-radio",
                        event: "change",
                        selectAll: (ev, domNode, treeNode, map) => {
                            state.vehicleMarkerLabelSelection = "icon";
                            for (const vehicleMap of vehicleMaps) {
                                if (vehicleMap.vehicleIcon) {
                                    vehicleMap.vehicleLabelContent.textContent = "";
                                    const iconImg = document.createElement("img");
                                    iconImg.src = vehicleMap.vehicleIcon;
                                    iconImg.className = "label-icon";
                                    vehicleMap.vehicleLabelContent.appendChild(iconImg);
                                } else {
                                    vehicleMap.vehicleLabelContent.textContent = vehicleMap.vehicleModelCode;
                                }
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
                {
                    label: `<b style="background-color: #0072CE; color: white;">
                                Metropolitan lines
                            </b>
                            &nbsp`,
                    selectAllCheckbox: true,
                    children: metroTrainTree
                },
                {
                    label: `<b style="background-color: #8F1A95; color: white;">
                                Regional lines
                            </b>
                            &nbsp`,
                    selectAllCheckbox: true,
                    children: regionTrainTree
                }
            ]
        },
        {
            label: "<b>Presets<b>",
            children: [
                {
                    label: `<button class="preset-button colour-button" title="Pakenham and Sunbury lines (Summer Start)" style="background-color: #279FD5;">
                                Metro Tunnel
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("vic:rail:THL", stopById, routeMaps, map);
                        }
                    }]
                },
                {
                    label: `<button class="preset-button colour-button" title="Burnley, Clifton Hill, Caulfield and Northern groups and City Circle line" style="background: linear-gradient(to right, #152C6B 25%, #BE1014 25% 50%, #279FD5 50% 75%, #FFBE00 75%);">
                                City Loop
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            setRoutes("vic:rail:MCE", stopById, routeMaps, map);
                            routeById["aus:vic:vic-02-RCE:"].layerGroup.remove();
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
                            setRoutes("vic:rail:RMD", stopById, routeMaps, map);
                            routeById["aus:vic:vic-02-WER:"].layerGroup.addTo(map);
                            routeById["aus:vic:vic-02-WIL:"].layerGroup.addTo(map);
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
                            setRoutes("vic:rail:SYR", stopById, routeMaps, map);
                            routeById["aus:vic:vic-02-WER:"].layerGroup.addTo(map);
                            routeById["aus:vic:vic-02-WIL:"].layerGroup.addTo(map);
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
                            setRoutes("vic:rail:CFD", stopById, routeMaps, map);
                            routeById["aus:vic:vic-02-WER:"].layerGroup.addTo(map);
                            routeById["aus:vic:vic-02-WIL:"].layerGroup.addTo(map);
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
                            setRoutes("vic:rail:NME", stopById, routeMaps, map);
                            routeById["aus:vic:vic-02-FKN:"].layerGroup.addTo(map);
                            routeById["aus:vic:vic-02-RCE:"].layerGroup.remove();
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
                            setRoutes("vic:rail:FSY", stopById, routeMaps, map);
                            routeById["aus:vic:vic-02-FKN:"].layerGroup.addTo(map);
                        }
                    }]
                }
            ]
        }
    ];
}

export { createTrainLayerTree };