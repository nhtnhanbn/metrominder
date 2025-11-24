const LControlWatermark = L.Control.extend({
    onAdd: (map) => {
        const title = L.DomUtil.create("a", "watermark");
        title.title = "About MetroMinder";
        
        const metro = L.DomUtil.create("span", null, title);
        metro.style.fontWeight = 1;
        metro.textContent = "METRO";

        const minder = L.DomUtil.create("span", null, title);
        minder.style.fontWeight = 1000;
        minder.textContent = "MINDER";
        
        const about = document.querySelector("dialog");
        title.addEventListener("click", (event) => {
            event.preventDefault();
            about.showModal();
        });
        
        return title;
    },
    
    onRemove: (map) => {}
});

const LControlInfo = L.Control.extend({
    onAdd: (map) => {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");

        const link = L.DomUtil.create("a", "leaflet-bar-part", container);
        link.textContent = "i";
        link.href = "#";
        link.title = "About MetroMinder";

        const about = document.querySelector("dialog");
        L.DomEvent.on(link, "click", (event) => {
            L.DomEvent.stopPropagation(event);
            L.DomEvent.preventDefault(event);
            about.showModal();
        }, this);

        return container;
    },
    
    onRemove: (map) => {}
});

export { LControlWatermark, LControlInfo }