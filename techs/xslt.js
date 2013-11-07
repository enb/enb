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
 * * *String* **xslFile** — XSL-Файл, с помощью которого производится трансформация
 *   (используется, если XSL-файл не является таргетом).
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
var fs = require('graceful-fs'),
    inherit = require('inherit'),
    childProcess = require('child_process'),
    Vow = require('vow'),
    vowFs = require('../lib/fs/async-fs');

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
            if (cache.needRebuildFile('target-file', targetPath) ||
                cache.needRebuildFile('source-file', sourcePath) ||
                cache.needRebuildFile('xsl-file', xslFile)
            ) {
                fs.open(targetPath, 'w', function(err, fd) {
                    if(err) return promise.reject(err);

                    childProcess.spawn('/usr/bin/xsltproc', args, { stdio: [null, fd, null] })
                        .on('error', function(err) {
                            promise.reject(err);
                        })
                        .on('close', function() {
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
