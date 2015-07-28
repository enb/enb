/**
 * ModuleConfig
 * ==========
 */
var inherit = require('inherit');

/**
 * ModuleConfig — конфигуратор модуля.
 * @name ModuleConfig
 */
module.exports = inherit(require('./configurable'), {

    /**
     * Конструктор.
     */
    __constructor: function () {
        this.__base();
    },

    getName: function () {
        throw new Error('You should override "getName" method of module.');
    }
});
