var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./css').buildFlow()
    .name('css-ie6')
    .target('target', '?.ie6.css')
    .useFileList('ie6.css')
    .createTech();
