import fs from "fs/promises";
import { parse } from "csv-parse/sync";

(async () => {
    const data = {
        "type" : "FeatureCollection",
        "name" : "public_transport_lines",
        "features" : []
    };
    
    const MODE = {
        1: "REGIONAL TRAIN",
        2: "METRO TRAIN",
        3: "METRO TRAM",
        4: "METRO BUS"
    };

    for (let number = 1; number <= 4; number++) {
        const rawShapes = await fs.readFile(`./gtfsschedule/${number}/shapes.txt`);
        const shapes = parse(rawShapes, { bom: true, columns: true });

        for (const point of shapes) {
            if (data.features.length === 0 || data.features[data.features.length-1].properties.SHAPE_ID !== point.shape_id) {
                let SHORT_NAME = "";
                if (number === 3) {
                    SHORT_NAME = point.shape_id.slice(2, point.shape_id.indexOf("-vpt"));
                } else if (number === 4) {
                    SHORT_NAME = point.shape_id.slice(3, point.shape_id.indexOf("-aus"));
                } else if (point.shape_id[6] === 'R') {
                    SHORT_NAME = "Replacement Bus";
                }

                data.features.push({
                    "type" : "Feature",
                    "geometry" : {
                        "type" : "LineString",
                        "coordinates" : []
                    },
                    "properties" : {
                        "SHAPE_ID" : point.shape_id,
                        "SHORT_NAME" : SHORT_NAME,
                        "MODE" : MODE[number]
                    }
                });
            }

            data.features[data.features.length-1].geometry.coordinates.push([parseFloat(point.shape_pt_lon), parseFloat(point.shape_pt_lat)]);
        }

        console.log(`${number} done.`);
    }

    await fs.writeFile("./public_transport_lines.geojson", JSON.stringify(data));
})();