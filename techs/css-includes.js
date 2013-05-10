var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('../lib/build-flow').create()
    .name('css-includes')
    .target('target', '?.css')
    .useFileList('css')
    .builder(function(cssFiles) {
        var node = this.node;
        return cssFiles.map(function(file) {
            return '@import "' + node.relativePath(file.fullname) + '";';
        }).join('\n');
    })
    .createTech();
