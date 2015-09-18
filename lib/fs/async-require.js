/**
 * async-require
 * =============
 *
 * Асинхронный require. Работает через промис.
 */
var vow = require('vow');

var delay = 1;

module.exports = function (filename) {
    return new vow.Promise(function (resolve, reject) {
        var doRequire = function () {
            try {
                var result = require(filename);
                resolve(result);
                delay = Math.max(1, delay / 2);
            } catch (e) {
                if (e.code === 'EMFILE') {
                    delay++;
                    setTimeout(doRequire, delay);
                } else {
                    reject(e);
                }
            }
        };
        doRequire();
    });
};
