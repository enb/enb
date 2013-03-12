var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./js-module'), {
    getName: function() {
        return 'js-i18n-module';
    },
    getDestSuffixes: function() {
        return ['ru.js', 'en.js'];
    },
    _buildChunks: function(sourceFiles, suffix) {
        var _this = this,
            lang = suffix.split('.')[0],
            allLangSource = this.node.getTargetName('lang.all.js'),
            langSource = this.node.getTargetName('lang.' + lang + '.js');
        return this.node.requireSources([allLangSource, langSource]).then(function() {
            return sourceFiles.map(function(file) {
                return fs.readFileSync(file.fullname, "utf8");
            }).concat([
                fs.readFileSync(_this.node.resolvePath(allLangSource), "utf8")
                + fs.readFileSync(_this.node.resolvePath(langSource), "utf8")
            ]);
        });
    }
});
