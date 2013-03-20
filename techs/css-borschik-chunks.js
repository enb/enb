var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    path = require('path'),
    crypto = require('crypto'),
    BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

module.exports = inherit(require('./css-chunks'), {
    configure: function() {
        this._freeze = this.getOption('freeze', false);
        this._minify = this.getOption('minify', true);
    },

    getName: function() {
        return 'css-borschik-chunks';
    },
    _processChunkData: function(sourceFile, data, suffix) {
        var _this = this,
            target = this.getTargetName(suffix);
        return this.node.createTmpFileForTarget(target).then(function(tmpFile) {
            return (new BorschikPreprocessor()).preprocessFile(sourceFile.fullname, tmpFile, _this._freeze, _this._minify).then(function() {
                return vowFs.read(tmpFile, 'utf8').then(function(data) {
                    vowFs.remove(tmpFile);
                    return data;
                });
            });
        });
    }
});
