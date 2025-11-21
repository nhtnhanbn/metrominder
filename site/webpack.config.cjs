const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");

module.exports = {
    mode: "development",
    entry: {
        train: "./src/train.js",
        tram: "./src/tram.js"
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/template.html",
            filename: "train/index.html",
            chunks: ["train"],
            favicon: "./src/favicon.svg"
        }),
        new HtmlWebpackPlugin({
            template: "./src/template.html",
            filename: "tram/index.html",
            chunks: ["tram"],
            favicon: "./src/favicon.svg"
        }),
        new WorkboxPlugin.GenerateSW({
            maximumFileSizeToCacheInBytes: 20971520,
            swDest: "./serviceWorker.js"
        }),
        new WebpackPwaManifest({
            publicPath: ".",
            filename: "manifest.json",
            "name": "MetroMinder",
            "short_name": "MetroMinder live PTV map",
            "start_url": ".",
            "display": "standalone",
            "description": "A live Melbourne train tracker.\nThis app maps realtime positions of metropolitan trains operated by Metro Trains Melbourne using public data distributed by Transport Victoria. View live departure and arrival updates, service information and consists with ease.",
            "icons": [
                {
                    "src": "./src/favicon192.png",
                    "type": "image/png",
                    "sizes": "192x192"
                },
                {
                    "src": "./src/favicon512.png",
                    "type": "image/png",
                    "sizes": "512x512"
                }
            ],
            "screenshots": [
                {
                    "src": "https://raw.githubusercontent.com/nhtnhanbn/metrominder/refs/heads/main/site/src/wide_screenshot.png",
                    "type": "image/png",
                    "sizes": "1920x1200",
                    "form_factor": "wide"
                },
                {
                    "src": "https://raw.githubusercontent.com/nhtnhanbn/metrominder/refs/heads/main/site/src/narrow_screenshot.png",
                    "type": "image/png",
                    "sizes": "1440x2960",
                    "form_factor": "narrow"
                }
            ]
        })
    ],
    module: {
        rules: [
            { test: /\.css$/i, use: ["style-loader", "css-loader"] },
            { test: /\.geojson$/, type: "json" },
            { test: /\.txt$/i, loader: "csv-loader", options: { header: true, skipEmptyLines: true } },
            { test: /\.(png|svg|jpg|jpeg|gif)$/i, type: "asset/resource" },
            { test: /\.html$/i, loader: "html-loader" }
        ]
    },
    devtool: "eval-source-map",
    devServer: {
        watchFiles: ["./src/template.html"]
    }
};
