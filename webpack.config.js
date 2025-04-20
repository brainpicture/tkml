const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Определяем, находимся ли мы в режиме разработки
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        tkml: './src/index.ts',
        styles: './src/styles.css'
    },
    output: {
        filename: '[name].min.js',
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
                            sourceMap: isDevelopment,
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
        new webpack.DefinePlugin({}),
        // Используем HtmlWebpackPlugin только в режиме разработки
        ...(isDevelopment ? [
            new HtmlWebpackPlugin({
                template: './index.html',
                filename: 'index.html',
                inject: false
            }),
            new webpack.HotModuleReplacementPlugin()
        ] : [])
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
    // Настройки dev-сервера только для режима разработки
    ...(isDevelopment ? {
        devServer: {
            static: {
                directory: path.join(__dirname, './'),
                watch: true,
            },
            compress: true,
            port: 9000,
            hot: true,
            liveReload: true,
            open: ['index.html'],
            watchFiles: ['src/**/*', 'index.html'],
            client: {
                overlay: true,
                progress: true,
            },
            devMiddleware: {
                writeToDisk: true,
            }
        },
        devtool: 'source-map'
    } : {})
}; 