const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


module.exports = {
    mode: 'production', // Set to 'development' for a non-minified build
    entry: './src/main.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|ogg)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    externals: {
        'phaser': 'Phaser',
    },
    plugins: [
        new CleanWebpackPlugin(), // Automatically clean the dist folder before each build
        new HtmlWebpackPlugin({
            template: './src/index.html',
            inject: true,
        }),
        
    ],
};