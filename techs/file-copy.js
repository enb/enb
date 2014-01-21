/**
 * file-copy
 * =========
 *
 * Копирует один таргет в другой.
 * Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.
 *
 * **Опции**
 *
 * * *String* **sourceTarget** — Исходный таргет. Обязательная опция.
 * * *String* **destTarget** — Результирующий таргет. Обязательная опция.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/file-copy'), {
 *   sourceTarget: '?.css',
 *   destTarget: '_?.css'
 * } ]);
 * ```
 */
var vowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'file-copy';
    },

    configure: function () {
        this._source = this.getRequiredOption('sourceTarget');
        this._target = this.getRequiredOption('destTarget');
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var target = this.node.unmaskTargetName(this._target);
        var targetPath = this.node.resolvePath(target);
        var source = this.node.unmaskTargetName(this._source);
        var sourcePath = this.node.resolvePath(source);
        var _this = this;
        var cache = this.node.getNodeCache(target);
        return this.node.requireSources([source]).then(function () {
            if (cache.needRebuildFile('source-file', sourcePath) ||
                cache.needRebuildFile('target-file', targetPath)
            ) {
                return vowFs.read(sourcePath, 'utf8').then(function (data) {
                    return vowFs.write(targetPath, data, 'utf8').then(function () {
                        cache.cacheFileInfo('source-file', sourcePath);
                        cache.cacheFileInfo('target-file', targetPath);
                        _this.node.resolveTarget(target);
                    });
                });
            } else {
                _this.node.isValidTarget(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});
