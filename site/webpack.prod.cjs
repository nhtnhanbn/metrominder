const { merge } = require("webpack-merge");
const common = require("./webpack.common.cjs");
const webpack = require("webpack");

module.exports = merge(common, {
    mode: "production",
    plugins: [
        new webpack.EnvironmentPlugin({ APIURL: "https://api.metrominder.nhan.au" })
    ]
});
