const { merge } = require("webpack-merge");
const common = require("./webpack.common.cjs");
const webpack = require("webpack");

module.exports = (env) => merge(common, {
    mode: "development",
    plugins: [
        new webpack.EnvironmentPlugin({ APIURL: env.APIURL })
    ],
    devtool: "eval-source-map",
    devServer: {
        watchFiles: ["./src/template.html"]
    }
});
