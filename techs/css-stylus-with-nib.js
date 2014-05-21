/**
 * css-stylus-with-nib
 * ===================
 *
 * Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
 * При сборке *styl*-файлов использует `nib`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет.
 *    По умолчанию — ['css', 'styl'].
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-stylus-with-nib'));
 * ```
 */

module.exports = require('./css-stylus').buildFlow()
    .name('css-stylus-with-nib')
    .deprecated('enb', 'enb-stylus')
    .methods({
        _configureRenderer: function (renderer) {
            var nib;
            try {
                nib = require('nib');
            } catch (e) {
                throw new Error(
                    'The technology "css-stylus-with-nib" cannot be executed ' +
                    'because the npm module "nib" was not found.'
                );
            }

            renderer.use(nib());
            return renderer;
        }
    })
    .createTech();
