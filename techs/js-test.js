/**
 * js-test
 * =======
 */
var Vow = require('vow'),
    vowFs = require('../lib/fs/async-fs'),
    FileList = require('../lib/file-list');

module.exports = require('../lib/build-flow').create()
    .name('js')
    .target('target', '?.test.js')
    .useFileList('test.js')
    .defineOption('fileMask', /.*/, '_fileMask')
    .builder(function(testFiles) {
        var fileMask = this._fileMask;
        testFiles = testFiles.filter(
            typeof fileMask === 'function' ? fileMask : function(file) {
                return fileMask.test(file.fullname);
            });
        return Vow.all(testFiles.map(function(file) {
            return vowFs.read(file.fullname, 'utf8');
        })).then(function(chunks) {
            return chunks.join('\n');
        });
    })
    .createTech();
