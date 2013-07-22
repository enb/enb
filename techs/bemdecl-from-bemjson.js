/**
 * bemdecl-from-bemjson
 * ====================
 *
 * Формирует *bemdecl* на основе `?.bemjson.js`.
 *
 * **Опции**
 *
 * * *String* **sourceTarget** — Исходный bemjson-таргет. По умолчанию — `?.bemjson.js`.
 * * *String* **destTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/bemdecl-from-bemjson'));
 * ```
 *
 */
var Vow = require('vow'),
    vowFs = require('../lib/fs/async-fs'),
    inherit = require('inherit'),
    vm = require('vm'),
    bemjson2bemdecl = require('../exlib/bemjson2bemdecl');

/**
 * @type {Tech}
 */
module.exports = require('../lib/build-flow').create()
    .name('bemdecl-from-bemjson')
    .target('destTarget', '?.bemdecl.js')
    .useSourceText('sourceTarget', '?.bemjson.js')
    .builder(function(bemjsonText) {
        var json = vm.runInThisContext(bemjsonText),
            decl = [];
        bemjson2bemdecl.iterateJson(json, bemjson2bemdecl.getBuilder(decl));
        return 'exports.blocks = ' + JSON.stringify(bemjson2bemdecl.mergeDecls([], decl), null, 4) + ';';
    })
    .createTech();
