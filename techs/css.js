var inherit = require('inherit'),
    fs = require('fs');
module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'css';
    },
    getDestSuffixes: function() {
        return ['css'];
    },
    getSourceSuffixes: function() {
        return ['css'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        return sourceFiles.map(function(file) {
            return fs.readFileSync(file.fullname);
        }).join('\n');
    }
});
