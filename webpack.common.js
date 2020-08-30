const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
        port: 8000
    },
    module: {
        rules: [
            {
                test: /\.hbs$/,
                loader: "handlebars-loader"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            favicon: "./docs/favicon.ico"
        })
    ]
};