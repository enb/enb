var inherit = require('inherit'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    FileList = require('../lib/file-list');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'js-expand-includes';
    },

    configure: function() {
        this._fileMask = this.getOption('fileMask', /.*/);
        this._target = this.getOption('target', this.node.getTargetName('test.bemdecl.js'));
    },

    getTargets: function() {
        return [
            this._target
        ];
    },

    build: function() {
        var bemdeclTarget = this.node.unmaskTargetName(this._target),
            bemdeclTargetPath = this.node.resolvePath(bemdeclTarget),
            _this = this,
            cache = this.node.getNodeCache(bemdeclTarget);
        return this.node.requireSources([this.node.getTargetName('levels')]).spread(function(files) {
            var sourceFiles = files.getFilesBySuffix('test.js'),
                filterFunction;
            if (typeof _this._fileMask === 'function') {
                filterFunction = _this._fileMask;
            } else {
                filterFunction = function(file) {
                    return _this._fileMask.test(file.fullname);
                };
            }
            sourceFiles = sourceFiles.filter(filterFunction);
            if (cache.needRebuildFile('bemdecl-file', bemdeclTargetPath)
                    || cache.needRebuildFileList('source-files', sourceFiles)) {
                var bemdecl = [];

                sourceFiles.forEach(function(file) {
                    var fileBemdecl = FileList.parseFilename(file.name).bemdecl;
                    bemdecl.push(fileBemdecl);
                });

                var bemdeclContent = 'exports.blocks = ' + JSON.stringify(bemdecl, null, 4) + ';';

                return vowFs.write(bemdeclTargetPath, bemdeclContent).then(function() {
                    cache.cacheFileInfo('bemdecl-file', bemdeclTargetPath);
                    cache.cacheFileList('source-files', sourceFiles);
                    _this.node.resolveTarget(bemdeclTarget);
                });
            } else {
                _this.node.getLogger().isValid(bemdeclTarget);
                _this.node.resolveTarget(bemdeclTarget);
                return null;
            }
        });
    }
});