var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('../lib/build-flow').create()
    .name('js')
    .target('target', '?.js')
    .useFileList('js')
    .builder(function(sourceFiles) {
        var node = this.node;
        return sourceFiles.map(function(file) {
            return 'include("' + node.relativePath(file.fullname) + '");';
        }).join('\n');
    })
    .createTech();
