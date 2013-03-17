var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    path = require('path'),
    crypto = require('crypto');

module.exports = inherit(require('./file-assemble-tech'), {
    getBuildResult: function(sourceFiles, suffix) {
        return this._getChunks(sourceFiles).then(function(items) {
            return 'module.exports = ' + JSON.stringify(items) + ';';
        });
    },
    _getChunks: function(sourceFiles, suffix) {
        var _this = this;
        return Vow.all(sourceFiles.map(function(sourceFile) {
            return vowFs.read(sourceFile.fullname, 'utf8').then(function(data) {
                var file = {};
                file.fullname = sourceFile.fullname;
                file.data = data;
                return _this._processChunk(file, suffix);
            });
        }));
    },
    _processChunk: function(sourceFile, suffix) {
        var data = this._processChunkData(sourceFile, sourceFile.data, suffix);
        var hash = crypto.createHash('sha1');
        hash.update(data);
        sourceFile.data = data;
        sourceFile.hash = hash.digest('base64');
        return sourceFile;
    },
    _processChunkData: function(sourceFile, data, suffix) {
        return data;
    }
});
