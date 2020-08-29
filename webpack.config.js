const path = require('path');

module.exports = {
    entry: {
        main: './docs/js/main.js'
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, 'docs'),
    },
};