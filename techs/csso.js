var fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    csso = require('csso');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'csso';
    },

    configure: function() {
        this._source = this.node.unmaskTargetName(this.getRequiredOption('sourceTarget'));
        this._target = this.node.unmaskTargetName(this.getRequiredOption('destTarget'));
        this._preserveStructure = this.getOption('preserveStructure', true);
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var target = this._target,
            targetPath = this.node.resolvePath(target),
            source = this._source,
            sourcePath = this.node.resolvePath(source),
            _this = this,
            cache = this.node.getNodeCache(target);
        return this.node.requireSources([source]).then(function() {
            if (cache.needRebuildFile('source-file', sourcePath)
                    || cache.needRebuildFile('target-file', targetPath)) {
                var cssoProcessor = CssoProcessor.fork();
                return Vow.when(cssoProcessor.process(sourcePath, targetPath, _this._preserveStructure)).then(function() {
                    cache.cacheFileInfo('source-file', sourcePath);
                    cache.cacheFileInfo('target-file', targetPath);
                    _this.node.resolveTarget(target);
                    cssoProcessor.dispose();
                });

            } else {
                _this.node.getLogger().isValid(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});

var CssoProcessor = require('sibling').declare({
    process: function(sourcePath, targetPath, preserveStructure) {
        return vowFs.read(sourcePath, 'utf8').then(function(data) {
            data = csso.justDoIt(data, preserveStructure);
            return vowFs.write(targetPath, data, 'utf8');
        });
    }
});