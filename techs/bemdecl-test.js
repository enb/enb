var inherit = require('inherit'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    fs = require('fs'),
    vm = require('vm'),
    FileList = require('../lib/file-list'),
    DepsResolver = require('../lib/deps/deps-resolver');

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
                depsFiles = files.getFilesBySuffix('test.deps.js'),
                filterFunction;
            if (typeof _this._fileMask === 'function') {
                filterFunction = _this._fileMask;
            } else {
                filterFunction = function(file) {
                    return _this._fileMask.test(file.fullname);
                };
            }
            sourceFiles = sourceFiles.filter(filterFunction);
            depsFiles = depsFiles.filter(filterFunction);
            if (cache.needRebuildFile('bemdecl-file', bemdeclTargetPath)
                    || cache.needRebuildFileList('source-files', sourceFiles)
                    || cache.needRebuildFileList('deps-files', depsFiles)
                ) {
                var deps = [];

                sourceFiles.forEach(function(file) {
                    var fileDeps = FileList.parseFilename(file.name).bem;
                    fileDeps.hasOwnProperty('modName') && (fileDeps.mod = fileDeps.modName);
                    fileDeps.hasOwnProperty('modVal') && (fileDeps.val = fileDeps.modVal);
                    deps.push(fileDeps);
                });

                var depsResolver = new DepsResolver(files);
                depsFiles.forEach(function(file) {
                    var fileDecl = FileList.parseFilename(file.name).bem;
                    var fileDeps = vm.runInThisContext(fs.readFileSync(file.fullname, "utf8"));
                    var allDeps = [];
                    if (fileDeps.mustDeps) {
                        allDeps = allDeps.concat(depsResolver.normalizeDeps(fileDeps.mustDeps, fileDecl.block, fileDecl.elem));
                    }
                    if (fileDeps.shouldDeps) {
                        allDeps = allDeps.concat(depsResolver.normalizeDeps(fileDeps.shouldDeps, fileDecl.block, fileDecl.elem));
                    }
                    allDeps.forEach(function(dep) {
                        dep.block = dep.name;
                        dep.hasOwnProperty('modName') && (dep.mod = dep.modName);
                        dep.hasOwnProperty('modVal') && (dep.val = dep.modVal);
                    });
                    deps = deps.concat(allDeps);
                });

                var bemdeclContent = 'exports.deps = ' + JSON.stringify(deps, null, 4) + ';';

                return vowFs.write(bemdeclTargetPath, bemdeclContent).then(function() {
                    cache.cacheFileInfo('bemdecl-file', bemdeclTargetPath);
                    cache.cacheFileList('source-files', sourceFiles);
                    cache.cacheFileList('deps-files', depsFiles);
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
