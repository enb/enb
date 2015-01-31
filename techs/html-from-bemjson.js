/**
 * html-from-bemjson
 * =================
 *
 * Технология устарела. Используйте технологию из пакета вашего шаблонизатора: `enb-xjst`, `enb-bemxjst`, `enb-bh`.
 */
var requireOrEval = require('../lib/fs/require-or-eval');
var asyncRequire = require('../lib/fs/async-require');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = require('../lib/build-flow').create()
    .name('html-from-bemjson')
    .target('destTarget', '?.html')
    .deprecated('enb', '', '', ' Use technology supplied with your template engine.')
    .useSourceFilename('bemhtmlTarget', '?.bemhtml.js')
    .useSourceFilename('bemjsonTarget', '?.bemjson.js')
    .builder(function (bemhtmlFilename, bemjsonFilename) {
        dropRequireCache(require, bemjsonFilename);
        return requireOrEval(bemjsonFilename).then(function (json) {
            dropRequireCache(require, bemhtmlFilename);
            return asyncRequire(bemhtmlFilename).then(function (bemhtml) {
                if (!bemhtml.BEMHTML && bemhtml.lib) {
                    return bemhtml.apply(json);
                } else {
                    return bemhtml.BEMHTML.apply(json);
                }
            });
        });
    })
    .createTech();
