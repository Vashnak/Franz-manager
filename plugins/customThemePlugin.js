const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const {execSync} = require('child_process');

const themesFolder = path.join(__dirname, 'src', 'assets', 'themes');
const coreFilePath = path.join(__dirname, 'src', 'core.scss');
const distPath = path.join(__dirname, 'dist');

let coreFile = fs.readFileSync(coreFilePath).toString();

class CustomThemePlugin {
    // Define the `apply` method
    apply(compiler) {
        compiler.hooks.compilation.tap('CustomThemePlugin', (compilation) => {
            compilation.fileTimestamps.forEach((value, key) => {
                if (key.includes('.scss') && !key.includes('core.scss') && value > Date.now() - 1000) {
                    console.log(key, value)
                    execSync('node ./generateCssThemes.js')
                }
            });
        });
    }
}

module.exports = CustomThemePlugin;
