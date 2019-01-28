const {execSync} = require('child_process');

class CustomThemePlugin {
    // Define the `apply` method
    apply(compiler) {
        compiler.hooks.compilation.tap('CustomThemePlugin', (compilation) => {
            compilation.fileTimestamps.forEach((value, key) => {
                if (key.includes('.scss') && !key.includes('core.scss') && value > Date.now() - 1000) {
                    execSync('node plugins/generateCssThemes.js');
                }
            });
        });
    }
}

module.exports = CustomThemePlugin;
