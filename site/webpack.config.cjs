const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

module.exports = {
    mode: "development",
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/template.html",
            favicon: "./src/favicon.svg"
        }),
        new WorkboxPlugin.GenerateSW({
            maximumFileSizeToCacheInBytes: 10485760,
            swDest: "./serviceWorker.js"
        })
    ],
    module: {
        rules: [
            { test: /\.css$/i, use: ["style-loader", "css-loader"] },
            { test: /\.geojson$/, type: "json" },
            { test: /\.txt$/i, loader: "csv-loader", options: { header: true, skipEmptyLines: true } },
            { test: /\.(png|svg|jpg|jpeg|gif)$/i, type: "asset/resource" }
        ]
    },
    devtool: "eval-source-map",
    devServer: {
        watchFiles: ["./src/template.html"]
    }
};
