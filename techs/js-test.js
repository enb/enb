/**
 * js-test
 * =======
 */
var vow = require('vow');
var vowFs = require('../lib/fs/async-fs');

module.exports = require('../lib/build-flow').create()
    .name('js-test')
    .target('target', '?.test.js')
    .useFileList('test.js')
    .defineOption('fileMask', /.*/, '_fileMask')
    .builder(function (testFiles) {
        var fileMask = this._fileMask;
        testFiles = testFiles.filter(
            typeof fileMask === 'function' ? fileMask : function (file) {
                return fileMask.test(file.fullname);
            });
        return vow.all(testFiles.map(function (file) {
            return vowFs.read(file.fullname, 'utf8');
        })).then(function (chunks) {
            return chunks.join('\n');
        });
    })
    .createTech();
