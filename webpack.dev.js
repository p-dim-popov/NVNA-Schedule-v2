const {merge} = require("webpack-merge")
const common =  require("./webpack.common.js")
const CopyPlugin = require('copy-webpack-plugin');

module.exports  = merge(common, {
    mode: 'development',
    devtool: "source-map",
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: './src/testScheduleData.json'}
            ]
        })
    ]
})