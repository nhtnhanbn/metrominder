# Nhan's MetroMinder

A live Victorian PT tracker. This site maps realtime positions of trains, trams and buses using public data distributed by Transport Victoria.

## Visit

View the website at [metrominder.nhan.au](https://metrominder.nhan.au).

## Usage

To run the api backend locally, get an [API key](https://opendata.transport.vic.gov.au) then
```
cd api
echo DTP_API_KEY="YOUR API KEY HERE" > .env
npm install
npm run start
```

If you want the PTV Timetable API (only used for static data retrieval scripts), you will need to separately [request](https://vic.gov.au/public-transport-timetable-api) to be registered.

To run the frontend site locally,
```
cd site
npm install
npm run dev --env APIURL="YOUR API URL HERE"
```

## Thanks

GTFS Schedule and GTFS Realtime data and transport mode pictograms © State of Victoria ([Department of Transport and Planning](https://opendata.transport.vic.gov.au/organization/public-transport)) licensed under a [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0).

Rolling stock information, fleet numbers and names from [Metro Trains Melbourne](https://cmsportal.metrotrains.com.au/docnum.aspx?id=A8520) and [Vicsig](https://vicsig.net/suburban/fleet).

Map tiles © [OpenStreetMap](https://openstreetmap.org/copyright).

Built using [Express](http://expressjs.com) and [Leaflet](https://leafletjs.com) on Node.

Dependencies include [Leaflet.ArrowCircle](https://github.com/nhtnhanbn/metrominder/tree/main/site/src/leaflet-arrowcircle).

Some other projects, covering more public transport modes, include:
- <a href="https://transportvic.me">TransportVic</a>: Realtime service details and station PID mockups
- <a href="https://transit.saikumarmk.com">Mini Melbourne 3D</a>: Realtime statewide vehicle position and station map
- <a href="https://anytrip.com.au/region/vic">AnyTrip</a>: Realtime vehicle position and station map with arrival details, covering multiple states
- <a href="https://tripview.com.au">TripView</a>: Realtime vehicle position, station and route map with arrival details, filtered by station, covering multiple states
- <a href="https://transport.domino6658.com">Live Trains Map</a>: Realtime train position map supporting search for specific carriages/trains and filtering by train types

Initially inspired by the [Ventura Tracker](https://venturabus.com.au/live-tracking) mobile app by BusMinder.

The code is under the MIT License: [api](api/LICENSE) and [site](site/LICENSE).
