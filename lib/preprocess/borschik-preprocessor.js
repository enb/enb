/**
 * BorschikPreprocessor
 * ====================
 */

var inherit = require('inherit');
var Vow = require('vow');
var borschik = require('borschik');

/**
 * BorschikPreprocessor — препроцессор js/css-файлов на основе Борщика.
 * @name BorschikPreprocessor
 */
module.exports = inherit({
    /**
     * Осуществляет обработку файла Борщиком.
     * @param {String} sourceFilename Исходный файл.
     * @param {String} destFilename Результирующий файл.
     * @param {Boolean} freeze Осуществлять ли фризинг.
     * @param {Boolean} minimize Осуществлять ли минимизацию.
     * @param {Tech} [tech]
     * @returns {*}
     */
    preprocessFile: function (sourceFilename, destFilename, freeze, minimize, tech) {
        var opts = {
            input: sourceFilename,
            output: destFilename,
            freeze: freeze,
            minimize: minimize
        };
        if (tech) {
            opts.tech = tech;
        }
        return Vow.when(borschik.api(opts));
    }
});
