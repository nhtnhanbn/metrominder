# MetroMinder

A live Melbourne train tracker. This site maps realtime positions of metropolitan trains operated by Metro Trains Melbourne using public data distributed by Transport Victoria.

## Visit

View the website at [metrominder.nhan.au](https://metrominder.nhan.au).

## Usage

To run the api backend locally, get an [API key](https://data-exchange.vicroads.vic.gov.au/) then
```
cd api
echo DTP_API_KEY="YOUR API KEY HERE" > .env
npm install
npm run start
```

To run the frontend site locally,
```
cd site
npm install
npm run dev
```

## Thanks

GTFS Schedule and GTFS Realtime data and metropolitan train pictogram © State of Victoria ([Department of Transport and Planning](https://opendata.transport.vic.gov.au/organization/public-transport)) licensed under a [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0).

Rolling stock information and codes from [Metro Trains Melbourne](https://cmsportal.metrotrains.com.au/docnum.aspx?id=A8520) and [Vicsig](https://vicsig.net/suburban/fleet).

Map tiles © [OpenStreetMap](https://openstreetmap.org/copyright).

Built using [Express](http://expressjs.com) and [Leaflet](https://leafletjs.com) on Node.

Dependencies include [Leaflet.ArrowCircle](https://github.com/nhtnhanbn/metrominder/tree/main/site/src/leaflet-arrowcircle).

Some other projects, covering more public transport modes, include:
- [TransportVic](https://transportvic.me): Realtime service details and station PID mockups
- [domino6658](https://home.domino6658.xyz/trains): Realtime vehicle position map supporting search for specific carriages/trains and filtering by train types
- [AnyTrip](https://anytrip.com.au/region/vic): Realtime vehicle position and station map with arrival details, covering multiple states
- [TripView](https://tripview.com.au): Realtime vehicle position, station and route map with arrival details, filtered by station, covering multiple states

Initially inspired by the [Ventura Tracker](https://venturabus.com.au/live-tracking) mobile app by BusMinder.

The code is under the MIT License: [api](api/LICENSE) and [site](site/LICENSE).
