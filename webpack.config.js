const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    plugins: [
        new webpack.ProvidePlugin({
            'jQuery': 'jquery',
            'window.jQuery': 'jquery',
            '$': 'jquery'
        }),
        new webpack.DefinePlugin({
            'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'SERVER_URL': JSON.stringify(process.env.SERVER_URL),
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.optimize.UglifyJsPlugin(), //minify everything
        new webpack.optimize.AggressiveMergingPlugin(), //Merge chunks
        new CopyWebpackPlugin([{ from: 'src/images/favicon.ico', to: 'favicon.ico' }])
    ],
    devtool: 'eval',
    entry: {
        'app': [
            'react-hot-loader/patch',
            './src/index'
        ]
    },
    output: {
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
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.scss|\.css$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader?limit=10000&mimetype=application/font-woff'
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader'
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loader: 'url-loader?limit=25000'
            }
        ]
    }
};
