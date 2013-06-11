/**
 * css-stylus-with-nib
 * ===================
 */

module.exports = require('./css-stylus.js').buildFlow()
    .name('css-stylus-with-nib')
    .methods({
        _configureRenderer: function(renderer) {
            try {
                var nib = require('nib');
            } catch (e) {
                console.log("Error: the technology 'css-stylus-with-nib' cannot be executed because the module 'nib' has not been found.");
            }

            renderer.use(nib());
            return renderer;
        }
    })
    .createTech();
