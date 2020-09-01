const {merge} = require("webpack-merge")
const common = require("./webpack.common.js")
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CompressionPlugin = require('compression-webpack-plugin');
const zlib = require("zlib");


module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new CleanWebpackPlugin(),
        new CompressionPlugin({
            filename: '[path].gz',
            algorithm: 'gzip',
            test: /\.js$|\.css$|\.html$/,
            threshold: 10240,
            minRatio: 0.8,
        }),
        new CompressionPlugin({
            filename: '[path].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            compressionOptions: {
                level: 11,
            },
            threshold: 10240,
            minRatio: 0.8,
        }),
    ]
})