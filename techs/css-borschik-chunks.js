var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    path = require('path'),
    crypto = require('crypto'),
    BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

module.exports = require('./css-chunks').buildFlow()
    .name('css-borschik-chunks')
    .defineOption('freeze', false)
    .defineOption('minify', false)
    .methods({
        processChunkData: function(sourceFilename, data) {
            var _this = this,
                target = this._target;
            return this.node.createTmpFileForTarget(target).then(function(tmpFile) {
                return (new BorschikPreprocessor()).preprocessFile(sourceFilename, tmpFile, _this._freeze, _this._minify).then(function() {
                    return vowFs.read(tmpFile, 'utf8').then(function(data) {
                        vowFs.remove(tmpFile);
                        return data;
                    });
                });
            });
        }
    })
    .createTech();