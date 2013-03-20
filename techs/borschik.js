var fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'borschik';
    },

    configure: function() {
        this._source = this.node.unmaskTargetName(this.getRequiredOption('sourceTarget'));
        this._target = this.node.unmaskTargetName(this.getRequiredOption('destTarget'));
        this._freeze = this.getOption('freeze', false);
        this._minify = this.getOption('minify', true);
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
                var borschikProcessor = BorschikProcessorSibling.fork();
                return Vow.when(borschikProcessor.process(sourcePath, targetPath, _this._freeze, _this._minify)).then(function() {
                    cache.cacheFileInfo('source-file', sourcePath);
                    cache.cacheFileInfo('target-file', targetPath);
                    _this.node.resolveTarget(target);
                    borschikProcessor.dispose();
                });

            } else {
                _this.node.getLogger().isValid(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});

var BorschikProcessorSibling = require('sibling').declare({
    process: function(sourcePath, targetPath, freeze, minify) {
        return (new BorschikPreprocessor()).preprocessFile(sourcePath, targetPath, freeze, minify);
    }
});