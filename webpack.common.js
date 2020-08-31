const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const WebpackPwaManifest = require("webpack-pwa-manifest");

module.exports = {
    entry: {
        main: ['./src/js/main.js'],
        install: ['./src/js/install.js']
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'docs')
    },
    devServer: {
        contentBase: path.join(__dirname, 'docs'),
        port: 8081
    },
    module: {
        rules: [
            {
                test: /\.hbs$/,
                loader: "handlebars-loader"
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            favicon: './src/favicon.ico'
        }),
        // new WorkboxPlugin.GenerateSW({
        //     // clientsClaim: true,
        //     // skipWaiting: true,
        //     include: [/offline.html/],
        //     sourcemap: true,
        //     navigateFallback: './offline.html'
        // }),
        new WorkboxPlugin.InjectManifest({
            swSrc: './src/js/service-worker.js',
            include: [/offline.html/]
        }),
        new CopyPlugin({
            patterns: [
                {from: './src/manifest.json'},
                {from: './src/images/', to: 'images/'},
                {from: './src/offline.html'}
            ]
        })
    ]
};