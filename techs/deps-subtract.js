var Vow = require('vow'),
    fs = require('fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'deps-subtract';
    },

    configure: function() {
        var _this = this;
        this._subtractWhatNodePath = this.getRequiredOption('subtractWhatNode');
        this._subtractWhatTarget = this.getRequiredOption('subtractWhatTarget');
        this._subtractFromTarget = this.getRequiredOption('subtractFromTarget');
        this._subtractFromNodePath = this.getOption('subtractFromNode', this.node.getPath());
        this._target = this.node.unmaskTargetName(this.getOption('depsTarget', this.node.getTargetName('deps.js')));
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function() {
        var _this = this,
            depsTarget = this.node.unmaskTargetName(this._target),
            depsTargetPath = this.node.resolvePath(depsTarget),
            cache = this.node.getNodeCache(depsTarget),
            fromNode = this._subtractFromNodePath,
            whatNode = this._subtractWhatNodePath,
            requirements = {};
        requirements[fromNode] = [this._subtractFromTarget];
        requirements[whatNode] = [this._subtractWhatTarget];
        return this.node.requireNodeSources(requirements).then(function(results) {
            var subtractFrom = results[fromNode][0],
                subtractWhat = results[whatNode][0];
            if (cache.needRebuildFile('deps-file', depsTargetPath)) {
                var subtractedDeps = deps.subtract(subtractFrom, subtractWhat);
                return vowFs.write(depsTargetPath, 'exports.deps = ' + JSON.stringify(subtractedDeps, null, 4) + ';').then(function() {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    _this.node.resolveTarget(depsTarget, subtractedDeps);
                });
            } else {
                _this.node.getLogger().isValid(depsTarget);
                delete require.cache[depsTargetPath];
                _this.node.resolveTarget(depsTarget, require(depsTargetPath).deps);
                return null;
            }
        });
    }
});