var inherit = require('inherit'),
    FileList = require('../lib/file-list'),
    fs = require('fs'),
    Vow = require('vow');

module.exports = inherit({
    __constructor: function(keysetsPath, laguages) {
        this._keysetsPath = keysetsPath;
        this._languages = laguages;
    },
    getName: function() {
        return 'i18n-merge-keysets';
    },
    init: function(node) {
        this.node = node;
        this._languages = this._languages || node.getLanguages() || [];
    },
    getTargets: function() {
        var _this = this;
        return this._languages.map(function(lang) {
            return _this.node.getTargetName('keysets.' + lang + '.js')
        });
    },
    build: function() {
        var _this = this,
            keysetFileList = new FileList();
        keysetFileList.loadFromDirSync(this._keysetsPath, true);
        this._languages.forEach(function(lang) {
            var target = _this.node.getTargetName('keysets.' + lang + '.js'),
                cache = _this.node.getNodeCache(target),
                langKeysetFiles = keysetFileList.getByName(lang + '.js'),
                targetPath = _this.node.resolvePath(target);
            if (cache.needRebuildFile('file', targetPath) || cache.needRebuildFileList('file-list', langKeysetFiles)) {
                var result = {};
                langKeysetFiles.forEach(function(keysetFile) {
                    var keyset = require(keysetFile.fullname);
                    for (var keysetName in keyset) {
                        if (keyset.hasOwnProperty(keysetName)) {
                            result[keysetName] = keyset[keysetName];
                        }
                    }
                });
                fs.writeFileSync(targetPath, 'module.exports = ' + JSON.stringify(result) + ';')
                cache.cacheFileInfo('file', targetPath);
                cache.cacheFileList('file-list', langKeysetFiles);
            }
            _this.node.resolveTarget(target);
        });
    },
    clean: function() {
        var _this = this;
        return Vow.all(this.getTargets().map(function(target) {
            _this.node.cleanTargetFile(target);
        }));
    }
});