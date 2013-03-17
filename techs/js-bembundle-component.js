var fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'js-bundle-component';
    },

    configure: function() {
        this._cssChunksTarget = this.node.unmaskTargetName(this.getOption('cssChunksTarget', '?.css-chunks.js'));
        this._jsChunksTarget = this.node.unmaskTargetName(this.getOption('jsChunksTarget', '?.js-chunks.js'));
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.bembundle.js'));
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function() {
        var _this = this;
        return Vow.when(this.getTargets()).then(function(targets) {
            return Vow.all(targets.map(function(target) {
                return _this._buildTarget(target);
            }));
        });
    },

    _isRebuildRequired: function(target) {
        var _this = this,
            cache = this.node.getNodeCache(target),
            jsChunkTargets = this._getJsChunkTargets(target),
            cssChunkTargets = this._getCssChunkTargets(target),
            i, l;
        if (cache.needRebuildFile('target-file', this.node.resolvePath(target))) {
            return true;
        }
        for (i = 0, l = jsChunkTargets.length; i < l; i++) {
            var jsChunkTarget = jsChunkTargets[i];
            if (cache.needRebuildFile('js-chunks-' + jsChunkTarget, _this.node.resolvePath(jsChunkTarget))) {
                return true;
            }
        }
        for (i = 0, l = cssChunkTargets.length; i < l; i++) {
            var cssChunkTarget = cssChunkTargets[i];
            if (cache.needRebuildFile('css-chunks-' + cssChunkTarget, _this.node.resolvePath(cssChunkTarget))) {
                return true;
            }
        }
        return false;
    },

    _cacheTargetInfo: function(target) {
        var _this = this,
            cache = this.node.getNodeCache(target);
        this._getJsChunkTargets(target).forEach(function(jsChunkTarget) {
            cache.cacheFileInfo('js-chunks-' + jsChunkTarget, _this.node.resolvePath(jsChunkTarget));
        });
        this._getCssChunkTargets(target).forEach(function(cssChunkTarget) {
            cache.cacheFileInfo('css-chunks-' + cssChunkTarget, _this.node.resolvePath(cssChunkTarget));
        });
        cache.cacheFileInfo('css-chunks-file', this.node.resolvePath(this._cssChunksTarget));
        cache.cacheFileInfo('target-file', this.node.resolvePath(target));
    },

    _buildJsBody: function(jsChunks, target) {
        var _this = this;
        return jsChunks.map(function(chunk) {
            return _this.__self.wrapWithOnceIf(chunk.data, chunk.fullname, chunk.hash);
        }).join('\n');
    },

    _getJsChunkTargets: function(target) {
        return [this._jsChunksTarget];
    },

    _getCssChunkTargets: function(target) {
        return [this._cssChunksTarget];
    },

    _buildTargetResult: function(target, jsChunks, cssChunks) {
        var _this = this;
        return Vow.when(this._buildJsBody(jsChunks, target)).then(function(jsBody) {
            var hcssChunks = cssChunks.map(function(chunk) {
                return [chunk.hash, chunk.data];
            });
            return [
                'BEM.blocks[\'i-loader\'].loaded({',
                'id: \'', _this.node.getTargetName(), '\',\n',
                'js: function(){\n',
                    _this.__self.getOnceFunctionDecl(),
                    '\n',
                    jsBody,
                '\n},\n',
                'hcss: ', JSON.stringify(hcssChunks, null, 4), '\n',
                '});'
            ].join('');
        });
    },

    _buildTarget: function(target) {
        var _this = this,
            targetPath = this.node.resolvePath(target),
            cssChunksTargets = this._getCssChunkTargets(target),
            jsChunksTargets = this._getJsChunkTargets(target);
        return this.node.requireSources(jsChunksTargets.concat(cssChunksTargets)).then(function() {
            if (_this._isRebuildRequired(target)) {
                var jsChunks = [],
                    cssChunks = [];
                cssChunksTargets.forEach(function(cssChunkTarget) {
                    var cssChunkTargetPath = _this.node.resolvePath(cssChunkTarget);
                    delete require.cache[cssChunkTargetPath];
                    cssChunks = cssChunks.concat(require(cssChunkTargetPath));
                });
                jsChunksTargets.forEach(function(jsChunkTarget) {
                    var jsChunkTargetPath = _this.node.resolvePath(jsChunkTarget);
                    delete require.cache[jsChunkTargetPath];
                    jsChunks = jsChunks.concat(require(jsChunkTargetPath));
                });
                return Vow.when(_this._buildTargetResult(target, jsChunks, cssChunks)).then(function(result) {
                    return vowFs.write(targetPath, result, 'utf8').then(function() {
                        _this._cacheTargetInfo(target);
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
}, {
    getOnceFunctionDecl: function() {
        return '(function(){ this._ycssjs || (this._ycssjs=function(a,b){return !(a in _ycssjs||_ycssjs[a]++)}) })();\n';
    },
    wrapWithOnceIf: function(data, filename, hash) {
        return 'if (_ycssjs("' + hash + '")) {\n' + '// ' + filename + '\n' + data + '\n}';
    },
    getExistingChunkDecl: function(hash) {
        return '_ycssjs("' + hash + '");\n';
    }
});