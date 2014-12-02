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
 * * *String* **node** — Путь ноды с исходным таргетом.
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

        this._fromNode = this.getOption('node');

        this._target = this.getOption('destTarget');
        if (!this._target) {
            this._target = this.getRequiredOption('target');
        }
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var node = this.node;
        var fromNode = this._fromNode;
        var target = node.unmaskTargetName(this._target);
        var targetPath = node.resolvePath(target);
        var source = fromNode ?
                node.unmaskNodeTargetName(fromNode, this._source) :
                node.unmaskTargetName(this._source);
        var sourcePath = fromNode ?
                node.resolveNodePath(fromNode, source) :
                node.resolvePath(source);

        var _this = this;
        var cache = this.node.getNodeCache(target);
        var requirements = {};
        requirements[fromNode] = [source];

        var requireSources = fromNode ?
                node.requireNodeSources(requirements) :
                node.requireSources([source]);

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
