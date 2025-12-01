"use strict";

(function (factory, window) {
  // define an AMD module that relies on 'leaflet'
  if (typeof define === "function" && define.amd) {
    define(["leaflet"], factory);

    // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === "object") {
    module.exports = factory(require("leaflet"));
  }

  // attach your plugin to the global 'L' variable
  if (typeof window !== "undefined" && window.L) {
    window.L.YourPlugin = factory(L);
  }
})(function (L) {
  L.DivIcon.ArrowCircle = L.DivIcon.extend({
    options: {
      stroke: "black",
      color: "#0080ff",
      size: 36,
      opacity: 1,
      rotation: undefined,
    },
    initialize: function (options) {
      options = L.Util.setOptions(this, options);
      options.iconSize = L.point([options.size, options.size]);
      options.className = "arrow-circle";

      this.iconAnchor = L.point(
        Number(options.size) / 2,
        Number(options.size) / 2
      );

      options.popupAnchor = L.point(0, -0.25 * options.size);

      options.html = this._createSVG();
    },
    _createDirectedCircle: function () {
      let radius = this.options.size / 4;

      let pathDescription =
        `M ${this.iconAnchor.x} ${this.iconAnchor.y-radius}` +
        `A ${radius} ${radius} 0 1 0 ${this.iconAnchor.x+radius} ${this.iconAnchor.y}` +
        `l 0 ${-radius} Z`;

      return `<path d="${pathDescription}" style="stroke: ${this.options.stroke}; fill: ${this.options.color}; opacity: ${this.options.opacity};"/>`;
    },
    _createFullCircle: function () {
      let radius = this.options.size / 4;
      return `<circle cx="${this.iconAnchor.x}" cy="${this.iconAnchor.x}" r="${radius}"  style="stroke: ${this.options.stroke}; fill: ${this.options.color}; opacity: ${this.options.opacity};"/>`;
    },
    _createSVG: function () {
      let group;
      if (this.options.rotation === undefined) {
        group =
          `<g>` +
          `${this._createFullCircle()}</g>`;
      } else {
        group =
          `<g transform="rotate(${this.options.rotation-45}, ${this.iconAnchor.x}, ${this.iconAnchor.y})">` +
          `${this._createDirectedCircle()}</g>`;
      }
      let className = this.options.className + "-svg";

      let style =
        "width:" +
        this.options.size +
        "px; height:" +
        this.options.size +
        "px;";

      return `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" style="${style}">${group}</svg>`;
    },
  });

  L.divIcon.arrowCircle = (options) => {
    return new L.DivIcon.ArrowCircle(options);
  };

  L.Marker.ArrowCircle = L.Marker.extend({
    options: {
      iconFactory: L.divIcon.arrowCircle,
      iconOptions: {},
    },
    initialize: function (latlng, options) {
      options = L.Util.setOptions(this, options);
      options.icon = options.iconFactory(options.iconOptions);
      this._latlng = latlng;
    },
    onAdd: function (map) {
      L.Marker.prototype.onAdd.call(this, map);
    },
    setRotation: function (rotation) {
      this.options.iconOptions.rotation = rotation;
      return this.setIcon(this.options.iconFactory(this.options.iconOptions));
    },
  });

  L.marker.arrowCircle = (latlng, options) => {
    return new L.Marker.ArrowCircle(latlng, options);
  };

  return L.Marker.ArrowCircle;
}, window);
