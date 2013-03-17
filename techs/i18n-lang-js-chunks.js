var inherit = require('inherit'),
    fs = require('fs'),
    vowFs = require('vow-fs'),
    Vow = require('vow'),
    crypto = require('crypto');

// TODO: кэширование
module.exports = inherit(require('./i18n-lang-js'), {
    getName: function() {
        return 'i18n-lang-js-chunks';
    },
    getTargetNameForLang: function(lang) {
        return this.node.getTargetName('js-chunks.lang.' + lang + '.js');
    },
    _processChunk: function(chunkData, fullname) {
        var hash = crypto.createHash('sha1');
        hash.update(chunkData);
        return {
            fullname: fullname,
            data: chunkData,
            hash: hash.digest('base64')
        };
    },
    _getBuildResult: function(keysets, lang) {
        var fullname = this.node.resolvePath(this.node.getTargetName('js-chunks.lang.' + lang + '.js'));
        var _this = this,
            res = [];
        Object.keys(keysets).sort().forEach(function(keysetName) {
            res.push(_this._processChunk(
                _this._getKeysetBuildResult(keysetName, keysets[keysetName], lang), fullname
            ));
        });
        res.push(this._processChunk(lang === 'all' ? '' : "BEM.I18N.lang('" + lang + "');", fullname));
        return 'module.exports = ' + JSON.stringify(res, null, 4) + ';';
    }
});