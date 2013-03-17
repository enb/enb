var inherit = require('inherit'),
    fs = require('fs'),
    vowFs = require('vow-fs'),
    Vow = require('vow'),
    tanker = require('../exlib/tanker');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'i18n-lang-js';
    },
    configure: function() {
        this._languages = ['all'].concat(this.getOption('languages', this.node.getLanguages() || []));
    },
    getTargets: function() {
        var _this = this;
        return this._languages.map(function(lang) {
            return _this.getTargetNameForLang(lang);
        });
    },
    getTargetNameForLang: function(lang) {
        return this.node.getTargetName('lang.' + lang + '.js');
    },
    build: function() {
        var _this = this,
            sources = this._languages.map(function(lang) {
                return _this.node.getTargetName('keysets.' + lang + '.js');
            });
        return this.node.requireSources(sources).then(function() {
            return Vow.all(_this._languages.map(function(lang) {
                var target = _this.getTargetNameForLang(lang),
                    targetPath = _this.node.resolvePath(target),
                    keysetsPath = _this.node.resolvePath(_this.node.getTargetName('keysets.' + lang + '.js')),
                    cache = _this.node.getNodeCache(target);
                if (cache.needRebuildFile('keysets-file', keysetsPath)
                        || cache.needRebuildFile('target-file', targetPath)) {
                    delete require.cache[keysetsPath];
                    return Vow.when(_this._getBuildResult(require(keysetsPath), lang)).then(function(data) {
                        return vowFs.write(
                                targetPath,
                                data,
                                'utf8'
                            ).then(function() {
                                cache.cacheFileInfo('keysets-file', keysetsPath);
                                cache.cacheFileInfo('target-file', targetPath);
                                _this.node.resolveTarget(target);
                            });
                    });
                } else {
                    _this.node.getLogger().isValid(target);
                    _this.node.resolveTarget(target);
                    return null;
                }
            }));
        });
    },

    _getBuildResult: function(keysets, lang) {
        var _this = this,
            res = [];
        Object.keys(keysets).sort().forEach(function(keysetName) {
            res.push(_this._getKeysetBuildResult(keysetName, keysets[keysetName], lang));
        });
        return this._getPrependJs(lang) + res.join('\n\n') + this._getAppendJs(lang);
    },

    _getKeysetBuildResult: function(keysetName, keyset, lang) {
        var res = [];
        if (keysetName === '') {
            res.push(keyset);
        } else {
            res.push("BEM.I18N.decl('" + keysetName + "', {");
            Object.keys(keyset).map(function(key, i, arr) {
                tanker.xmlToJs(keyset[key], function(js) {
                    res.push('    ' + JSON.stringify(key) + ': ' + js + (i === arr.length - 1 ? '' : ','));
                });
            });
            res.push('}, {\n"lang": "' + lang + '"\n});');
        }
        return res.join('\n');
    },

    _getPrependJs: function(lang) {
        return '';
    },
    _getAppendJs: function(lang) {
        return lang === 'all' ? '' : "\n\nBEM.I18N.lang('" + lang + "');\n";
    }
});