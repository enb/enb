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

/**
 * @name requireOrEval
 * @returns {Promise}
 */
module.exports = function (filePath) {
    delete require.cache[filePath];
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
