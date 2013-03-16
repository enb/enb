var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./js'), {
    getName: function() {
        return 'js-i18n';
    },
    configure: function() {
        this._languages = this.getOption('languages', this.node.getLanguages() || []);
    },
    getDestSuffixes: function() {
        return this._languages.map(function(lang) {
            return lang + '.js'
        });
    },
    isRebuildRequired: function(suffix) {
        var lang = suffix.split('.')[0],
            langTarget = this.node.getTargetName('lang.' + lang + '.js'),
            target = this.getTargetName(suffix);
        return this.__base(suffix)
            || this.node.getNodeCache(target).needRebuildFile('lang-file', this.node.resolvePath(langTarget));
    },
    cacheSuffixInfo: function(suffix) {
        var lang = suffix.split('.')[0],
            langTarget = this.node.getTargetName('lang.' + lang + '.js'),
            target = this.getTargetName(suffix);
        this.__base(suffix);
        this.node.getNodeCache(target).cacheFileInfo('lang-file', this.node.resolvePath(langTarget));
    },
    getBuildResult: function(sourceFiles, suffix) {
        var _this = this,
            lang = suffix.split('.')[0],
            langTarget = this.node.getTargetName('lang.' + lang + '.js');
        return this.node.requireSources([langTarget]).then(function() {
            return sourceFiles.map(function(file) {
                return fs.readFileSync(file.fullname, "utf8");
            }).join('\n')
            + '\n' +  fs.readFileSync(_this.node.resolvePath(langTarget), 'utf8');
        });
    }
});
