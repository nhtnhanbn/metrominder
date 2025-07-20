import { timeString } from "./timeString.js";

L.Control.Clock = L.Control.extend({
    onAdd: function(map) {
        const clock = L.DomUtil.create("div", "leaflet-control-attribution");
        setInterval(() => {
            const time = timeString(Math.floor(Date.now()/1000), true);
            clock.textContent = `Current time: ${time}`;
        }, 1000);
        return clock;
    },

    onRemove: function(map) {}
});

L.control.clock = function(options) {
    return new L.Control.Clock(options);
}
