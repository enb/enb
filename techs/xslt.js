var fs = require('fs'),
    inherit = require('inherit'),
    childProcess = require('child_process'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

// TODO: кэширование
module.exports = inherit({
    __constructor: function(sourceSuffix, destSuffix, options) {
        this._options = options || {};
        this._sourcePrefix = sourceSuffix;
        this._destSuffix = destSuffix;
    },

    getName: function() {
        return 'xslt';
    },

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName(this._destSuffix)];
    },

    build: function() {
        var _this = this,
            options = this._options,
            promise = Vow.promise(),
            source = this.node.getTargetName(this._sourcePrefix),
            sourcePath = this.node.resolvePath(source),
            target = this.node.getTargetName(this._destSuffix),
            targetPath = this.node.resolvePath(target),
            cache = this.node.getNodeCache(target),
            sources = [source],
            xslFile = options.xslFile;

        if (options.xslSource) {
            var xslSource = options.xslSource;
            xslSource = this.node.unmaskTargetName(xslSource);
            xslFile = this.node.resolvePath(xslSource);
            sources.push(xslSource);
        }

        this.node.requireSources(sources).then(function() {
            var args = (options.args || []).concat([xslFile, sourcePath]);
            // TODO: XSL Include deps tree.
            if (cache.needRebuildFile('target-file', targetPath)
                    || cache.needRebuildFile('source-file', sourcePath)
                    || cache.needRebuildFile('xsl-file', xslFile)) {
                childProcess.execFile('/usr/bin/xsltproc', args, {}, function(err, xsltStdout, stderr) {
                    if (err) return promise.reject(err);
                    vowFs.write(targetPath, xsltStdout, "utf8").then(function() {
                        cache.cacheFileInfo('target-file', targetPath);
                        cache.cacheFileInfo('source-file', sourcePath);
                        cache.cacheFileInfo('xsl-file', xslFile);
                        _this.node.resolveTarget(target);
                        promise.fulfill();
                    });
                    return null;
                });
            } else {
                _this.node.getLogger().isValid(target);
                _this.node.resolveTarget(target);
                promise.fulfill();
            }
        });
        return promise;
    },

    clean: function() {
        var _this = this;
        return Vow.all(this.getTargets().map(function(target) {
            _this.node.cleanTargetFile(target);
        }));
    }
});
