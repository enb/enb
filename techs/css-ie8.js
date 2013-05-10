var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./css').buildFlow()
    .name('css-ie8')
    .target('target', '?.ie8.css')
    .useFileList('ie8.css')
    .createTech();
