/**
 * ModuleConfig
 * ==========
 */
var inherit = require('inherit');

/**
 * ModuleConfig используется для конфигурации подключаемых модулей.
 * @name ModuleConfig
 */
module.exports = inherit(require('./configurable'), {
    __constructor: function(modeName) {
        this.__base();
        this._name = modeName;
    },

    removeChain: function() {
        this._chains.length = 0;
    }
});
