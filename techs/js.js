var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'js';
    },
    getDestSuffixes: function() {
        return ['js'];
    },
    getSourceSuffixes: function() {
        return ['js'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        return sourceFiles.map(function(file) {
            return fs.readFileSync(file.fullname, "utf8");
        }).join('\n');
    }
});
