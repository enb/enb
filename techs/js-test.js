var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow');
    vowFs = require('vow-fs'),
    FileList = require('../lib/file-list');

module.exports = inherit(require('./js'), {
    configure: function() {
        this._fileMask = this.getOption('fileMask', /.*/);
    },
    filterSourceFiles: function(files) {
        var fileMask = this._fileMask;
        return files.filter(
            typeof fileMask == 'function' ? fileMask : function(file) {
                return fileMask.test(file.fullname);
            });
    },
    getBuildResult: function(sourceFiles, suffix) {
        return Vow.all(sourceFiles.map(function(file) {
            return vowFs.read(file.fullname, 'utf8').then(function(data) {
                return data + '\nBEM.TEST.add(' + JSON.stringify(FileList.parseFilename(file.name).bem) + ');\n';
            });
        })).then(function(chunks) {
            return chunks.join('\n');
        });
    },
    getName: function() {
        return 'js-test';
    },
    getDestSuffixes: function() {
        return ['test.js'];
    },
    getSourceSuffixes: function() {
        return ['test.js'];
    }
});
