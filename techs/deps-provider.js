var Vow = require('vow'),
    fs = require('fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'deps-provider';
    },

    configure: function() {
        this._sourceNodePath = this.getRequiredOption('sourceNodePath');
        this._sourceTarget = this.getOption('sourceTarget', '?.deps.js');
        this._target = this.node.unmaskTargetName(this.getOption('depsTarget', '?.deps.js'));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var _this = this,
            depsTarget = this._target,
            depsTargetPath = this.node.resolvePath(depsTarget),
            fromNode = this._sourceNodePath,
            cache = this.node.getNodeCache(depsTarget),
            requirements = {};
        requirements[fromNode] = [this._sourceTarget];
        return this.node.requireNodeSources(requirements).then(function(results) {
            var deps = results[fromNode][0];
            if (cache.needRebuildFile('deps-file', depsTargetPath)) {
                return vowFs.write(depsTargetPath, 'exports.deps = ' + JSON.stringify(deps, null, 4) + ';').then(function() {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    _this.node.resolveTarget(depsTarget, deps);
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