'use strict';

/**
 * NodeMaskConfig
 * ==============
 */
const inherit = require('inherit');

/**
 * NodeMaskConfig используется для конфигурации нод, путь которых соответствует регулярному выражению.
 * @name NodeMaskConfig
 */
module.exports = inherit(require('./configurable'), {
    __constructor(mask) {
        this.__base();
        this._mask = mask;
    },
    getMask() {
        return this._mask;
    }
});
