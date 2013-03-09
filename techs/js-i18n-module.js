var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./js-module'), {
    getName: function() {
        return 'js-i18n-module';
    },
    getDestSuffixes: function() {
        return ['ru.js', 'en.js'];
    },
    _buildChunks: function(sourceFiles) {
        return sourceFiles.map(function(file) {
            return fs.readFileSync(file.fullname, "utf8");
        }).concat(['\nBEM.I18N = function(keyset, key) {return key;};']);
    }
});
