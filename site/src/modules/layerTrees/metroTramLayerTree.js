import { setRoutes } from "../routeFilters.js";

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
                            setRoutes("19489", stopById, routeMaps, map);
                        }
                    }]
                }
            ]
        }
    ];
}

export { createMetroTramLayerTree };