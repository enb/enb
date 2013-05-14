/**
 * xslt
 * ====
 *
 * Выполняет XSLT-преобразование.
 *
 * **Опции**
 *
 * * *String* **sourceTarget** — Исходный таргет. Обязательная опция.
 * * *String* **destTarget** — Результирующий таргет. Обязательная опция.
 * * *String* **xslSource** — XSL-Таргет, с помощью которого производится трансформация.
 * * *String* **xslFile** — XSL-Файл, с помощью которого производится трансформация (используется, если XSL-файл не является таргетом).
 * * *String[]* **args** — Аргументы для xsltproc. По умолчанию — `[]`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/xslt'))({
 *     sourceTarget: '?.keysets.{lang}.xml',
 *     destTarget: '?.lang.{lang}.xsl',
 *     xslFile: config.resolvePath('blocks/lego/tools/tanker/tools/generate/i18n.xsl.xsl'),
 *     args: ['--xinclude']
 * }]);
 * ```
 */
var fs = require('fs'),
    inherit = require('inherit'),
    childProcess = require('child_process'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'xslt';
    },

    init: function(node) {
        this.__base.apply(this, arguments);
        this._sourceTarget = this.getRequiredOption('sourceTarget');
        this._destTarget = this.getRequiredOption('destTarget');
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._destTarget)];
    },

    build: function() {
        var _this = this,
            options = this._options,
            promise = Vow.promise(),
            source = this.node.unmaskTargetName(this._sourceTarget),
            sourcePath = this.node.resolvePath(source),
            target = this.node.unmaskTargetName(this._destTarget),
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
    }
});
