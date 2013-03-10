var inherit = require('inherit'),
    fs = require('fs');
module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'js-includes';
    },
    getDestSuffixes: function() {
        return ['js'];
    },
    getSourceSuffixes: function() {
        return ['js'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        var node = this.node;
        return sourceFiles.map(function(file) {
            return 'include("' + node.relativePath(file.fullname) + '");';
        }).join('\n');
    }
});
