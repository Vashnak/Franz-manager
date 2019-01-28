const webpack = require('webpack');
const path = require('path');
const CustomThemePlugin = require('./plugins/customThemePlugin');
const CopyFaviconPlugin = require('./plugins/copyFaviconPlugin');

module.exports = {
    devServer: {
        historyApiFallback: {
            rewrites: [
                {from: /\./, to: '/'}
            ]
        }
    },
    optimization: {
        minimize: false
    },
    plugins: [
        new webpack.DefinePlugin({
            'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            'SERVER_URL': JSON.stringify(process.env.SERVER_URL || ''),
	    'WEBSOCKET_SERVER_URL': JSON.stringify(process.env.WEBSOCKET_SERVER_URL || ''),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        new webpack.optimize.AggressiveMergingPlugin(), //Merge chunks
	new CopyFaviconPlugin('src/assets/images/favicon.png'),
        new CustomThemePlugin()
    ],
    entry: {
        'app': [
            '@babel/polyfill',
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
