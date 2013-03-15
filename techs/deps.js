var Vow = require('vow'),
    fs = require('fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    DepsResolver = require('../lib/deps/deps-resolver'),
    inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'deps';
    },

    configure: function() {
        this._target = this.node.unmaskTargetName(
            this.getOption('depsTarget', this.node.getTargetName('deps.js')));
        this._bemdeclTarget = this.node.unmaskTargetName(
            this.getOption('bemdeclTarget', this.node.getTargetName('bemdecl.js')));
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function() {
        var _this = this,
            depsTarget = this._target,
            depsTargetPath = this.node.resolvePath(depsTarget),
            cache = this.node.getNodeCache(depsTarget),
            bemdeclSource = this._bemdeclTarget,
            bemdeclSourcePath = this.node.resolvePath(bemdeclSource);
        return this.node.requireSources([this.node.getTargetName('levels'), bemdeclSource]).spread(function(levels) {
            var depFiles = levels.getFilesBySuffix('deps.js');
            if (cache.needRebuildFile('deps-file', depsTargetPath)
                    || cache.needRebuildFile('bemdecl-file', bemdeclSourcePath)
                    || cache.needRebuildFileList('deps-file-list', depFiles)) {
                var bemdecl = require(bemdeclSourcePath),
                    dep = new DepsResolver(levels);
                bemdecl.blocks.forEach(function(block) {
                    dep.addBlock(block.name);
                    if (block.mods) {
                        block.mods.forEach(function(mod) {
                            if (mod.vals) {
                                mod.vals.forEach(function(val) {
                                    dep.addBlock(block.name, mod.name, val.name);
                                });
                            }
                        });
                    }
                    if (block.elems) {
                        block.elems.forEach(function(elem){
                            dep.addElem(block.name, elem.name);
                            if (elem.mods) {
                                elem.mods.forEach(function(mod) {
                                    if (mod.vals) {
                                        mod.vals.forEach(function(val) {
                                            dep.addElem(block.name, elem.name, mod.name, val.name);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                var resolvedDeps = dep.resolve();
                return vowFs.write(depsTargetPath, 'exports.deps = ' + JSON.stringify(resolvedDeps) + ';', 'utf8').then(function() {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    cache.cacheFileInfo('bemdecl-file', bemdeclSourcePath);
                    cache.cacheFileList('deps-file-list', depFiles);
                    _this.node.resolveTarget(depsTarget, resolvedDeps);
                });
            } else {
                _this.node.getLogger().isValid(depsTarget);
                _this.node.resolveTarget(depsTarget, require(depsTargetPath).deps);
                return null;
            }
        });
    }
});