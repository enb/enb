var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./css').buildFlow()
    .name('css-ie9')
    .target('target', '?.ie9.css')
    .useFileList('ie9.css')
    .createTech();
