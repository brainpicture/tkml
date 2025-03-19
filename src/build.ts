import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

// Создаем универсальный билд для сервера и браузера
async function buildUniversalVersion() {
    try {
        // CSS уже должен быть собран webpack'ом
        console.log('Building server version with webpack...');

        // Создаем временный webpack конфиг для серверной версии
        const serverConfig = `
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.ts',
    target: 'node',
    output: {
        filename: 'tkml.server.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            type: 'commonjs',
        },
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'typeof window': JSON.stringify('undefined'),
        }),
    ],
};
        `;

        // Записываем временный конфиг
        fs.writeFileSync('webpack.server.config.js', serverConfig);

        // Запускаем webpack с временным конфигом
        child_process.execSync('npx webpack --config webpack.server.config.js --mode production', { stdio: 'inherit' });

        // Удаляем временный конфиг
        fs.unlinkSync('webpack.server.config.js');

        console.log('Server version built successfully');

        // Продолжаем с созданием HTML
        buildHtml();
    } catch (error) {
        console.error('Failed to build server version:', error);
        process.exit(1);
    }
}

// Создаем HTML с встроенными ресурсами
function buildHtml() {
    try {
        // Read the files
        const jsContent = fs.readFileSync(path.resolve(__dirname, '../dist/tkml.min.js'), 'utf8');
        const cssContent = fs.readFileSync(path.resolve(__dirname, '../dist/styles.min.css'), 'utf8');

        let code = `
                const container = document.getElementById('container');
                const tkml = new TKML(container, { dark: true, URLControl: true });
                if (!tkml.fromUrl()) {
                    tkml.fromText("<title center>TKML</title><br/><br/><input href='/' placeholder='Enter TKML app URL here' /><br/><br/><desc center><a href='examples/index.tkml'>examples</a></desc>");
                }
        `;

        // Create HTML with inline resources
        let html = `<!DOCTYPE html>
        <html>
        <head>
            <title>TKML App</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQflAx4QGA4EvmzDAAAA30lEQVRIx2NgGAWMCKa8JKM4A8Ovt88ekyLCDGOoyDBJMjExMbFy8zF8/EKsCAMDE8yAPyIwFps48SJIBpAL4AZwvoSx/r0lXgQpDN58EWL5x/7/H+vL20+JFxluQKVe5b3Ke5V+0kQQCamfoYKBg4GDwUKI8d0BYkWQkrLKewYBKPPDHUFiRaiZkBgmwhj/F5IgggyUJ6i8V3mv0kCayDAAeEsklXqGAgYGhgV3CnGrwVciYSYk0kokhgS44/JxqqFpiYSZbEgskd4dEBRk1GD4wdB5twKXmlHAwMDAAACdEZau06NQUwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0wNy0xNVQxNTo1Mzo0MCswMDowMCVXsDIAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMDctMTVUMTU6NTM6NDArMDA6MDBUCgiOAAAAAElFTkSuQmCC">
            <style>${cssContent}</style>
        </head>
        <body>
            <div id="container"></div>
            <script>${jsContent}</script>
            <script>${code}</script>
        </body>
        </html>`;

        // Write the output file
        fs.writeFileSync(path.resolve(__dirname, '../dist/index.html'), html);
        console.log('HTML built successfully');
    } catch (error) {
        console.error('Failed to build HTML:', error);
    }
}

// Запускаем сборку
buildUniversalVersion();