/**
 * css-stylus-with-nib
 * ===================
 * Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
 * При сборке *styl*-файлов использует `nib`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-stylus-with-nib'));
 * ```
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
