/**
 * NodeMaskConfig
 * ==============
 */
var inherit = require('inherit');

/**
 * NodeMaskConfig используется для конфигурации нод, путь которых соответствует регулярному выражению.
 * @name NodeMaskConfig
 */
module.exports = inherit(require('./configurable'), {
    __constructor: function (mask) {
        this.__base();
        this._mask = mask;
    },
    getMask: function () {
        return this._mask;
    }
});
