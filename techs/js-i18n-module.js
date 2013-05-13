/**
 * js-i18n-module
 * ==============
 */
var inherit = require('inherit'),
    vm = require('vm'),
    fs = require('fs');

module.exports = require('./js-module.js').buildFlow()
    .name('js-i18n-module')
    .target('target', '?.{lang}.js')
    .defineRequiredOption('lang')
    .createTech();
