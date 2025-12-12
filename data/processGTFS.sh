#!/bin/bash

node --max-old-space-size=8192 getStopRoutes.mjs
node shapesToGeoJSON.mjs
node filterGeoJSON.mjs