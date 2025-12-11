#!/bin/bash

wget http://data.ptv.vic.gov.au/downloads/gtfs.zip

unzip -o gtfs.zip -d ./gtfsschedule
unzip -o ./gtfsschedule/1/google_transit.zip -d ./gtfsschedule/1
unzip -o ./gtfsschedule/2/google_transit.zip -d ./gtfsschedule/2
unzip -o ./gtfsschedule/3/google_transit.zip -d ./gtfsschedule/3
unzip -o ./gtfsschedule/4/google_transit.zip -d ./gtfsschedule/4

rm gtfs.zip

node fixGTFS.mjs