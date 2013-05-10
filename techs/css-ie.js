var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./css').buildFlow()
    .name('css-ie')
    .target('target', '?.ie.css')
    .useFileList('ie.css')
    .createTech();
