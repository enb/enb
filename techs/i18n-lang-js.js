var inherit = require('inherit'),
    fs = require('fs'),
    vowFs = require('vow-fs'),
    Vow = require('vow'),
    tanker = require('../exlib/tanker');

// TODO: кэширование
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
            return _this.node.getTargetName('lang.' + lang + '.js');
        });
    },
    // TODO: сделать кэширование, добавить зависимость кэша от keysets.js
    build: function() {
        var _this = this,
            sources = this._languages.map(function(lang) {
                return _this.node.getTargetName('keysets.' + lang + '.js');
            });
        return this.node.requireSources(sources).then(function() {
            return Vow.all(_this._languages.map(function(lang) {
                var target = _this.node.getTargetName('lang.' + lang + '.js'),
                    keysets = require(_this.node.resolvePath(_this.node.getTargetName('keysets.' + lang + '.js'))),
                    res = [];
                Object.keys(keysets).sort().map(function(keysetName) {
                    var keyset = keysets[keysetName];
                    if (keysetName === '') {
                        res.push(keyset);
                        return;
                    }
                    res.push("\nBEM.I18N.decl('" + keysetName + "', {");
                    Object.keys(keyset).map(function(key, i, arr) {
                        tanker.xmlToJs(keyset[key], function(js) {
                            res.push('    ' + JSON.stringify(key) + ': ' + js + (i === arr.length - 1 ? '' : ','));
                        });
                    });
                    res.push('}, {\n"lang": "' + lang + '"\n});\n');
                });
                var js = _this._getPrependJs(lang) + res.join('\n') + _this._getAppendJs(lang);
                return vowFs.write(
                        _this.node.resolvePath(target),
                        js,
                        "utf8"
                    ).then(function() {
                        _this.node.resolveTarget(target);
                    });
            }));
        });
    },
    _getPrependJs: function(lang) {
        return '';
    },
    _getAppendJs: function(lang) {
        return lang === 'all' ? '' : "\nBEM.I18N.lang('" + lang + "');\n";
    }
});