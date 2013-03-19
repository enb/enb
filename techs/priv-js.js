var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    configure: function() {
        this._bemhtmlTarget = this.node.unmaskTargetName(this.getOption('bemhtmlTarget', '?.bemhtml.js'));
    },
    getName: function() {
        return 'priv-js';
    },
    getDestSuffixes: function() {
        return ['priv.js'];
    },
    getSourceSuffixes: function() {
        return ['priv.js'];
    },
    isRebuildRequired: function(suffix) {
        var bemhtmlTarget = this._bemhtmlTarget,
            target = this.getTargetName(suffix);
        return this.__base(suffix)
            || this.node.getNodeCache(target).needRebuildFile('bemhtml-file', this.node.resolvePath(bemhtmlTarget));
    },
    cacheSuffixInfo: function(suffix) {
        var bemhtmlTarget = this._bemhtmlTarget,
            target = this.getTargetName(suffix);
        this.__base(suffix);
        this.node.getNodeCache(target).cacheFileInfo('bemhtml-file', this.node.resolvePath(bemhtmlTarget));
    },
    getBuildResult: function(sourceFiles, suffix) {
        var _this = this,
            bemhtmlPromise = this.node.requireSources([this._bemhtmlTarget]);
        return Vow.all(sourceFiles.map(function(file) {
            return vowFs.read(file.fullname, "utf8");
        })).then(function(res) {
            return bemhtmlPromise.then(function() {
                var bemhtmlTargetPath = _this.node.resolvePath(_this._bemhtmlTarget);
                return vowFs.read(bemhtmlTargetPath, 'utf8').then(function(bemhtml) {
                    return bemhtml + '\n' + res.join('\n');
                });
            });
        });
    }
});
