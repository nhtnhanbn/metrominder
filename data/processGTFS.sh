#!/bin/bash

node getStopRoutes.mjs
node shapesToGeoJSON.mjs
node filterGeoJSON.mjs