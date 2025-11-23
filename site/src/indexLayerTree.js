import { setRoutes } from "./routeFilters.js";

function createIndexLayerTree(routeMaps, routeByCode, stopById, vehicleMaps, stopLayer, layerGroupByMode, state) {
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
            label: `<b style="background-color: #0072CE; color: white;">
                        Metropolitan trains
                    </b>
                    &nbsp`,
            layer: layerGroupByMode.metroTrain
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
                        }
                    }]
                }
            ]
        }
    ];
}

export { createIndexLayerTree };