var inherit = require('inherit'),
    fs = require('fs');
module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'css-includes';
    },
    getDestSuffixes: function() {
        return ['css'];
    },
    getSourceSuffixes: function() {
        return ['css'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        var node = this.node;
        return sourceFiles.map(function(file) {
            return '@import "' + node.relativePath(file.fullname) + '";';
        }).join('\n');
    }
});
