var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow');

module.exports = inherit({
    __constructor: function(laguages) {
        this._languages = laguages;
    },
    getName: function() {
        return 'i18n-merge-keysets';
    },
    init: function(node) {
        this.node = node;
        this._languages = ['all'].concat(this._languages || node.getLanguages() || []);
    },
    getTargets: function() {
        var _this = this;
        return this._languages.map(function(lang) {
            return _this.node.getTargetName('keysets.' + lang + '.js')
        });
    },
    build: function() {
        var _this = this;
        return this.node.requireSources([this.node.getTargetName('dirs')]).spread(function(dirs) {
            var langKeysetDirs = dirs.getBySuffix('i18n'),
                allLangKeysetFiles = [].concat.apply([], langKeysetDirs.map(function(dir) {
                    return dir.files;
                }));

            _this._languages.forEach(function(lang) {
                var target = _this.node.getTargetName('keysets.' + lang + '.js'),
                    targetPath = _this.node.resolvePath(target),
                    cache = _this.node.getNodeCache(target),
                    langKeysetFiles = allLangKeysetFiles.filter(function(file) {
                        return file.name == lang + '.js';
                    });
                if (cache.needRebuildFile('file', targetPath) || cache.needRebuildFileList('file-list', langKeysetFiles)) {
                    var result = {};
                    langKeysetFiles.forEach(function(keysetFile) {
                        var keysets = require(keysetFile.fullname);
                        if (lang === 'all') { // XXX: Why the hell they break the pattern?
                            keysets = keysets['all'] || {};
                        }
                        Object.keys(keysets).forEach(function(keysetName) {
                            var keyset = keysets[keysetName];
                            result[keysetName] = (result[keysetName] || {});
                            if (typeof keyset !== 'string') {
                                Object.keys(keyset).forEach(function(keyName) {
                                    result[keysetName][keyName] = keyset[keyName];
                                });
                            } else {
                                result[keysetName] = keyset;
                            }
                        });
                    });
                    fs.writeFileSync(targetPath, 'module.exports = ' + JSON.stringify(result) + ';');
                    cache.cacheFileInfo('file', targetPath);
                    cache.cacheFileList('file-list', langKeysetFiles);
                }
                _this.node.resolveTarget(target);
            });
        });
    },
    clean: function() {
        var _this = this;
        return Vow.all(this.getTargets().map(function(target) {
            _this.node.cleanTargetFile(target);
        }));
    }
});