var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./css-css-includes').buildFlow()
    .name('css-ie-includes')
    .target('target', '?.ie.css')
    .useFileList('ie.css')
    .createTech();
