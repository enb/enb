/**
 * css-borschik-chunks
 * ===================
 *
 * Технология переехала в пакет `enb-borschik`.
 */
var vowFs = require('../lib/fs/async-fs');
var BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

module.exports = require('./css-chunks').buildFlow()
    .name('css-borschik-chunks')
    .deprecated('enb', 'enb-borschik')
    .defineOption('freeze', false)
    .defineOption('minify', false)
    .defineOption('tech', null)
    .methods({
        processChunkData: function (sourceFilename) {
            var _this = this;
            var target = this._target;
            return this.node.createTmpFileForTarget(target).then(function (tmpFile) {
                return (new BorschikPreprocessor()).preprocessFile(
                    sourceFilename, tmpFile, _this._freeze, _this._minify, _this._tech
                ).then(function () {
                    return vowFs.read(tmpFile, 'utf8').then(function (data) {
                        vowFs.remove(tmpFile);
                        return data;
                    });
                });
            });
        }
    })
    .createTech();
