/**
 * file-copy
 * =========
 *
 * Копирует один таргет в другой.
 * Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.
 *
 * **Опции**
 *
 * * *String* **source** — Исходный таргет. Обязательная опция.
 * * *String* **sourceNode** — Путь ноды с исходным таргетом.
 * * *String* **target** — Результирующий таргет. Обязательная опция.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/file-copy'), {
 *   source: '?.css',
 *   target: '_?.css'
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
        this._source = this.getOption('sourceTarget');
        if (!this._source) {
            this._source = this.getRequiredOption('source');
        }

        this._sourceNode = this.getOption('node');

        this._target = this.getOption('destTarget');
        if (!this._target) {
            this._target = this.getRequiredOption('target');
        }
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var _this = this;
        var node = this.node;
        var cache = node.getNodeCache(target);
        var target = node.unmaskTargetName(this._target);
        var targetPath = node.resolvePath(target);
        var sourceNode = this._sourceNode;
        var source;
        var sourcePath;
        var requirements = {};
        var requireSources;

        if (sourceNode) {
            source = node.unmaskNodeTargetName(sourceNode, this._source);
            sourcePath = node.resolveNodePath(sourceNode, source);
            requirements[sourceNode] = [source];
            requireSources = node.requireNodeSources(requirements);
        } else {
            source = node.unmaskTargetName(this._source);
            sourcePath = node.resolvePath(source);
            requireSources = node.requireSources([source]);
        }

        return requireSources.then(function () {
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
