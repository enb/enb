/**
 * async-require
 * =============
 *
 * Асинхронный require. Работает через промис.
 */
var Vow = require('vow');

var delay = 1;

module.exports = function (filename) {
    var promise = Vow.promise();
    var doRequire = function () {
        try {
            var result = require(filename);
            promise.fulfill(result);
            delay = Math.max(1, delay / 2);
        } catch (e) {
            if (e.code === 'EMFILE') {
                delay++;
                setTimeout(doRequire, delay);
            } else {
                promise.reject(e);
            }
        }
    };
    doRequire();
    return promise;
};
