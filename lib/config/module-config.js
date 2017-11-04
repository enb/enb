'use strict';

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
    __constructor() {
        this.__base();
    },

    getName() {
        throw new Error('You should override "getName" method of module.');
    }
});
