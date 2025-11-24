import { setRoutes } from "./routeFilters.js";

function createIndexLayerTree(routeMaps, routeById, stopById, vehicleMaps, stopLayer, layerGroupByMode, state) {
    setInterval(() => {
        document.querySelector(
            `input[name=labels][value=${state.vehicleMarkerLabelSelection}]`
        ).checked = true;
    }, 0);

    return [
        {
            label: "Vehicle marker labels",
            children: [
                {
                    label: `<label title="Label vehicle markers with route code">
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
                    label: `<label title="Label vehicle markers with type code">
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
            label: "Show stops",
            layer: stopLayer
        },
        {
            label: `<div class="leaflet-control-layers-separator"></div>`
        },
        {
            label: "Use search for individual routes and buses."
        },
        {
            label: "<b>All railways<b>",
            selectAllCheckbox: true,
            children: [
                {
                    label: `<span style="background-color: #78BE20; color: white;">
                                Trams
                            </span>
                            &nbsp`,
                    layer: layerGroupByMode.metroTram
                },
                {
                    label: `<span style="background-color: #0072CE; color: white;">
                                Metropolitan trains
                            </span>
                            &nbsp`,
                    layer: layerGroupByMode.metroTrain
                },
                {
                    label: `<span style="background-color: #8F1A95; color: white;">
                                Regional trains
                            </span>
                            &nbsp`,
                    layer: layerGroupByMode.regionTrain
                }
            ]
        },
        {
            label: "<b>Presets<b>",
            children: [
                {
                    label: `<button class="preset-button" title="Clear all">
                                Clear all
                            </button>`,
                    eventedClasses: [{
                        className: "preset-button",
                        event: "click",
                        selectAll: (ev, domNode, treeNode, map) => {
                            for (const layerGroup of Object.values(layerGroupByMode)) {
                                layerGroup.remove();
                            }

                            for (const routeMap of routeMaps) {
                                routeMap.layerGroup.remove();
                            }
                        }
                    }]
                }
            ]
        }
    ];
}

export { createIndexLayerTree };