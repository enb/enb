/**
 * xslt
 * ====
 *
 * Технология переехала в пакет `enb-lego-xml`.
 * ```
 */
var fs = require('fs');
var inherit = require('inherit');
var childProcess = require('child_process');
var Vow = require('vow');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'xslt';
    },

    init: function () {
        this.__base.apply(this, arguments);
        this._sourceTarget = this.getRequiredOption('sourceTarget');
        this._destTarget = this.getRequiredOption('destTarget');
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._destTarget)];
    },

    build: function () {
        var _this = this;
        var options = this._options;
        var promise = Vow.promise();
        var source = this.node.unmaskTargetName(this._sourceTarget);
        var sourcePath = this.node.resolvePath(source);
        var target = this.node.unmaskTargetName(this._destTarget);
        var targetPath = this.node.resolvePath(target);
        var cache = this.node.getNodeCache(target);
        var sources = [source];
        var xslFile = options.xslFile;

        this.node.getLogger().logTechIsDeprecated(
            target,
            'xslt',
            'enb',
            'xslt',
            'enb-lego-xml'
        );

        if (options.xslSource) {
            var xslSource = options.xslSource;
            xslSource = this.node.unmaskTargetName(xslSource);
            xslFile = this.node.resolvePath(xslSource);
            sources.push(xslSource);
        }

        this.node.requireSources(sources).then(function () {
            var args = (options.args || []).concat([xslFile, sourcePath]);
            // TODO: XSL Include deps tree.
            if (cache.needRebuildFile('target-file', targetPath) ||
                cache.needRebuildFile('source-file', sourcePath) ||
                cache.needRebuildFile('xsl-file', xslFile)
            ) {
                fs.open(targetPath, 'w', function (err, fd) {
                    if (err) {
                        return promise.reject(err);
                    }

                    childProcess.spawn('/usr/bin/xsltproc', args, { stdio: [null, fd, null] })
                        .on('error', function (err) {
                            promise.reject(err);
                        })
                        .on('close', function () {
                            cache.cacheFileInfo('target-file', targetPath);
                            cache.cacheFileInfo('source-file', sourcePath);
                            cache.cacheFileInfo('xsl-file', xslFile);
                            _this.node.resolveTarget(target);
                            promise.fulfill();
                        });
                });
            } else {
                _this.node.isValidTarget(target);
                _this.node.resolveTarget(target);
                promise.fulfill();
            }
        });
        return promise;
    }
});
