import { addRoutes } from "../routeFilters.js";

function createMetroTramLayerTree(routeMaps, routeById, stopById, vehicleMaps, stopLayer, state) {
    setInterval(() => {
        document.querySelector(
            `input[name=labels][value=${state.vehicleMarkerLabelSelection}]`
        ).checked = true;
    }, 0);

    const layerLeaves = [...routeMaps].map((routeMap) => {
        return {
            label: `<span style="background-color: ${routeMap.routeColour}; color: ${routeMap.routeTextColour};">
                        ${routeMap.routeShortName} ${routeMap.routeLongName}&nbsp
                    </span>`,
            layer: routeMap.layerGroup
        };
    });

    return [
        {
            label: "Tram marker labels",
            children: [
                {
                    label: `<label title="Label tram markers with route code">
                                <input class="marker-radio" type="radio" name="labels" value="route">
                                Route
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
                    label: `<label title="Label tram markers with class code">
                                <input class="marker-radio" type="radio" name="labels" value="model">
                                Class
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
                    label: `<label title="Display tram markers as tram icons">
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
            label: "Show stops",
            layer: stopLayer
        },
        {
            label: `<div class="leaflet-control-layers-separator"></div>`
        },
        {
            label: "<b>All routes<b>",
            selectAllCheckbox: true,
            children: layerLeaves
        },
        {
            label: "<b>Presets<b>",
            children: [
                {
                    label: `<button class="preset-button" title="Routes 1, 3, 5, 6, 16, 64, 67 and 72">
                                Melbourne University/Swanston St
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            addRoutes("19489", stopById, routeMaps, map);
                        }
                    }]
                },
                {
                    label: `<button class="preset-button" title="Routes 19, 67, 75, 86, 96 and 109">
                                Night Trams
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            for (const routeCode of [19, 67, 75, 86, 96, 109]) {
                                routeById[`aus:vic:vic-03-${routeCode}:`].layerGroup.addTo(map);
                            }
                        }
                    }]
                }
            ]
        }
    ];
}

export { createMetroTramLayerTree };