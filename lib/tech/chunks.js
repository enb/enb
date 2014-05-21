/**
 * chunks
 * ======
 *
 * Базовая технология для chunks-технологий.
 * Помогает реализовывать технологии для bembundle-сборок.
 *
 * @deprecated
 */

var Vow = require('vow');
var vowFs = require('../fs/async-fs');
var crypto = require('crypto');

module.exports = require('../build-flow').create()
    .name('chunks')
    .deprecated('enb')
    .useFileList('chunk')
    .target('target', 'chunks.js')
    .builder(function (chunkFiles) {
        return Vow.when(this.getChunks(chunkFiles)).then(function (items) {
            return 'module.exports = ' + JSON.stringify(items) + ';';
        });
    })
    .methods({
        getChunks: function (sourceFiles) {
            var _this = this;
            return Vow.all(sourceFiles.map(function (sourceFile) {
                return vowFs.read(sourceFile.fullname, 'utf8').then(function (data) {
                    return _this.processChunk(sourceFile.fullname, data);
                });
            }));
        },
        processChunk: function (filename, data) {
            return Vow.when(this.processChunkData(filename, data)).then(function (data) {
                var hash = crypto.createHash('sha1');
                hash.update(data);
                return {
                    fullname: filename,
                    data: data,
                    hash: hash.digest('base64')
                };
            });
        },
        processChunkData: function (filename, data) {
            return data;
        }
    })
    .createTech();
