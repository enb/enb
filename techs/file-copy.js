var fs = require('fs'), Vow = require('vow'), vowFs = require('vow-fs'), inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'file-copy';
    },

    init: function(node) {
        this.__base(node);
        this._source = this.getRequiredOption('sourceTarget');
        this._target = this.getRequiredOption('destTarget');
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function() {
        var target = this.node.unmaskTargetName(this._target),
            targetPath = this.node.resolvePath(target),
            source = this.node.unmaskTargetName(this._source),
            sourcePath = this.node.resolvePath(source),
            _this = this,
            cache = this.node.getNodeCache(target);
        return this.node.requireSources([source]).then(function() {
            if (cache.needRebuildFile('source-file', sourcePath)
                    || cache.needRebuildFile('target-file', targetPath)) {
                return vowFs.read(sourcePath, 'utf8').then(function(data) {
                    return vowFs.write(targetPath, data, 'utf8').then(function() {
                        cache.cacheFileInfo('source-file', sourcePath);
                        cache.cacheFileInfo('target-file', targetPath);
                        _this.node.resolveTarget(target);
                    });
                });
            } else {
                _this.node.getLogger().isValid(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});