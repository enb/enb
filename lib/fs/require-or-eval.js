/**
 * requireOrEval
 * =============
 *
 * Модуль, помогающий поддерживать переходные (с `eval` на `require`) BEM-форматы.
 *
 * Например, раньше `bemjson` выглядел так:
 * ```javascript
 * ({
 *     block: 'button'
 * })
 * ```
 *
 * Новый вариант `bemjson` выглядит так:
 * ```javascript
 * module.exports = {
 *     block: 'button'
 * };
 * ```
 */

var asyncRequire = require('./async-require');
var vowFs = require('./async-fs');
var vm = require('vm');
var dropRequireCache = require('./drop-require-cache');

/**
 * @name requireOrEval
 * @returns {Promise}
 */
module.exports = function (filePath) {
    // Replace slashes with backslashes for windows paths for correct require cache work.
    var isWinPath = /^\w{1}:/.test(filePath);
    filePath = isWinPath ? filePath.replace(/\//g, '\\') : filePath;

    dropRequireCache(require, filePath);
    return asyncRequire(filePath).then(function (json) {
        if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
            var hasData = false;
            for (var i in json) {
                if (json.hasOwnProperty(i)) {
                    hasData = true;
                    break;
                }
            }
            if (hasData) {
                return json;
            } else {
                return vowFs.read(filePath, 'utf8').then(function (data) {
                    return vm.runInThisContext(data);
                });
            }
        } else {
            // Если был возвращен не объект, либо null, значит значение явно экспортировалось.
            return json;
        }
    });
};
