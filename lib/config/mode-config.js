/**
 * ModeConfig
 * ==========
 */
var inherit = require('inherit');

/**
 * ModeConfig используется для конфигурации проекта в рамках режима.
 * Режим задается с помощью ENV-переменной YENV.
 * @name ModeConfig
 */
module.exports = inherit(require('./configurable'), {
    __constructor: function (modeName) {
        this.__base();
        this._name = modeName;
    }
});
