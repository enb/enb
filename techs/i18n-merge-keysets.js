var inherit = require('inherit'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'i18n-merge-keysets';
    },
    configure: function() {
        this._languages = ['all'].concat(this.getOption('languages', this.node.getLanguages() || []));
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

            return Vow.all(_this._languages.map(function(lang) {
                var target = _this.node.getTargetName('keysets.' + lang + '.js'),
                    targetPath = _this.node.resolvePath(target),
                    cache = _this.node.getNodeCache(target),
                    langKeysetFiles = allLangKeysetFiles.filter(function(file) {
                        return file.name == lang + '.js';
                    });
                if (cache.needRebuildFile('file', targetPath) || cache.needRebuildFileList('file-list', langKeysetFiles)) {
                    var result = {};
                    langKeysetFiles.forEach(function(keysetFile) {
                        delete require.cache[keysetFile.fullname];
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
                    return vowFs.write(targetPath, 'module.exports = ' + JSON.stringify(result) + ';').then(function() {
                        cache.cacheFileInfo('file', targetPath);
                        cache.cacheFileList('file-list', langKeysetFiles);
                        _this.node.resolveTarget(target);
                    });
                } else {
                    _this.node.getLogger().isValid(target);
                    _this.node.resolveTarget(target);
                    return null;
                }
            }));
        });
    }
});