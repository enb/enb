/**
 * borschik
 * ========
 *
 * Обрабатывает файл Борщиком (раскрытие borschik-ссылок, минификация, фризинг).
 *
 * Настройки фризинга и путей описываются в конфиге Борщика (`.borschik`) в корне проекта
 * (https://github.com/veged/borschik/blob/master/README.ru.md).
 *
 * **Опции**
 *
 * * *String* **sourceTarget** — Исходный таргет. Например, `?.js`. Обязательная опция.
 * * *String* **destTarget** — Результирующий таргет. Например, `_?.js`. Обязательная опция.
 * * *Boolean* **minify** — Минифицировать ли в процессе обработки. По умолчанию — `true`.
 * * *Boolean* **freeze** — Использовать ли фризинг в процессе обработки. По умолчанию — `false`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/borschik'), {
 *   sourceTarget: '?.css',
 *   destTarget: '_?.css',
 *   minify: true,
 *   freeze: true
 * } ]);
 * ```
 */
var fs = require('graceful-fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

/**
 * @type {Tech}
 */
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
            if (cache.needRebuildFile('source-file', sourcePath) ||
                cache.needRebuildFile('target-file', targetPath)
            ) {
                var borschikProcessor = BorschikProcessorSibling.fork();
                return Vow.when(
                    borschikProcessor.process(sourcePath, targetPath, _this._freeze, _this._minify)
                ).then(function() {
                    cache.cacheFileInfo('source-file', sourcePath);
                    cache.cacheFileInfo('target-file', targetPath);
                    _this.node.resolveTarget(target);
                    borschikProcessor.dispose();
                });
            } else {
                _this.node.isValidTarget(target);
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
