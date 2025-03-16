const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'tkml.min.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'TKML',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            "buffer": false,
            "stream": false,
            "string_decoder": false,
            "process": false
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        }
                    }
                ],
            },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.min.css',
        }),
        new webpack.DefinePlugin({})
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        ascii_only: true
                    }
                }
            }),
            new CssMinimizerPlugin(),
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
    }
}; 