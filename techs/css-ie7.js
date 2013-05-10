var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./css').buildFlow()
    .name('css-ie7')
    .target('target', '?.ie7.css')
    .useFileList('ie7.css')
    .createTech();
