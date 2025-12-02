import omnIcon from "./combinedPT.svg";
import trainIcon from "./combinedTrain.svg";
import tramIcon from "./PICTO_MODE_Tram.svg";

const LControlWatermark = L.Control.extend({
    onAdd: (map) => {
        const title = L.DomUtil.create("a", "watermark");
        title.title = "About Nhan's MetroMinder";
        
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
        link.innerHTML = `<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="15" cy="7" r="2"/>
                              <path
                                  d="
                                      M 13 14
                                      A 2 2 0 1 1 17 14
                                      L 17 23
                                      A 2 2 0 1 1 13 23 Z
                              "/>
                          </svg>`;
        link.href = "#";
        link.title = "About Nhan's MetroMinder";

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

const LControlOmni = L.Control.extend({
    onAdd: (map) => {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control unclear");

        const link = L.DomUtil.create("a", "leaflet-bar-part", container);
        link.href = "/";
        link.title = "All train, tram and bus modes map";

        const icon = document.createElement("img");
        icon.src = omnIcon;
        icon.style.padding = "5px";
        link.appendChild(icon);


        return container;
    },
    
    onRemove: (map) => {}
});


const LControlTrain = L.Control.extend({
    onAdd: (map) => {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control unclear");

        const link = L.DomUtil.create("a", "leaflet-bar-part", container);
        link.href = "/train";
        link.title = "Metro Trains Melbourne and V/Line regional trains map";

        const icon = document.createElement("img");
        icon.src = trainIcon;
        icon.style.padding = "5px";
        link.appendChild(icon);


        return container;
    },
    
    onRemove: (map) => {}
});

const LControlTram = L.Control.extend({
    onAdd: (map) => {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control unclear");

        const link = L.DomUtil.create("a", "leaflet-bar-part", container);
        link.href = "/tram";
        link.title = "Trams map";

        const icon = document.createElement("img");
        icon.src = tramIcon;
        icon.style.padding = "5px";
        link.appendChild(icon);


        return container;
    },
    
    onRemove: (map) => {}
});

export { LControlWatermark, LControlInfo, LControlOmni, LControlTrain, LControlTram }