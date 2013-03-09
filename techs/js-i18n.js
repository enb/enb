var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./js'), {
    getName: function() {
        return 'js-i18n';
    },
    getDestSuffixes: function() {
        return ['ru.js', 'en.js'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        return sourceFiles.map(function(file) {
            return fs.readFileSync(file.fullname, "utf8");
        }).join('\n')
        + '\nBEM.I18N = function(keyset, key) {return key;};';
    }
});
