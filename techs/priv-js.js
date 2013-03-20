var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

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
            target = this.getTargetName(suffix),
            bemhtmlPromise = this.node.requireSources([this._bemhtmlTarget]),
            jsBorschikPreprocessor = new BorschikPreprocessor();
        return Vow.all(sourceFiles.map(function(file) {
            return _this.node.createTmpFileForTarget(target).then(function(tmpfile) {
                return jsBorschikPreprocessor.preprocessFile(file.fullname, tmpfile).then(function() {
                    return vowFs.read(tmpfile, "utf8").then(function(data) {
                        vowFs.remove(tmpfile);
                        return data;
                    });
                });
            });
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
