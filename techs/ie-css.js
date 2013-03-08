var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'ie-css';
    },
    getDestSuffixes: function() {
        return ['ie.css'];
    },
    getSourceSuffixes: function() {
        return ['ie.css'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        return sourceFiles.map(function(file) {
            return fs.readFileSync(file.fullname);
        }).join('\n');
    }
});
