/**
 * bemjson-from-bemtree
 * =================
 *
 * Собирает *bemjson*-файл с помощью *bemtree*, передавая в BEMTREE.apply пустой контекст.
 *
 * **Опции**
 *
 * * *String* **bemtreeTarget** — Исходный BEMTREE-файл. По умолчанию — `?.bemtree.js`.
 * * *String* **destTarget** — Результирующий BEMJSON-файл. По умолчанию — `?.bemjson`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/bemjson-from-bemtree'));
 * ```
 */
var requireOrEval = require('../lib/fs/require-or-eval');
var asyncRequire = require('../lib/fs/async-require');

module.exports = require('../lib/build-flow').create()
    .name('bemjson-from-bemtree')
    .target('destTarget', '?.bemjson.js')
    .useSourceFilename('bemtreeTarget', '?.bemtree.js')
    .builder(function (bemtreeFilename) { // todo ", dataFilename"
        delete require.cache[bemtreeFilename];
        return asyncRequire(bemtreeFilename).then(function(bemtree) {
            return bemtree.BEMTREE.apply({}).then(function(bemjson) { 
                return '(' + JSON.stringify(bemjson.valueOf(), null, 4) + ')';
            });
        });
    })
    .createTech();
