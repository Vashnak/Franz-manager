const webpack = require('webpack');
const path = require('path');
const CopyFaviconPlugin = require('./plugins/copyFaviconPlugin');

module.exports = {
    mode: 'production',
    optimization: {
        minimize: true
    },
    plugins: [
        new webpack.DefinePlugin({
            'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
            'SERVER_URL': JSON.stringify(process.env.SERVER_URL || ''),
	    'WEBSOCKET_SERVER_URL': JSON.stringify(process.env.WEBSOCKET_SERVER_URL || ''),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        }),
        new webpack.optimize.AggressiveMergingPlugin(), //Merge chunks
	new CopyFaviconPlugin('src/assets/images/favicon.png')
    ],
    entry: {
        'app': [
            './src/index'
        ]
    },
    output: {
        publicPath: '/',
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.scss|\.css$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/,
                loader: 'url-loader'
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loader: 'url-loader?limit=25000'
            }
        ]
    }
};
