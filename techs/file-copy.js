'use strict'

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
const inherit = require('inherit');

const enb = require('../lib/api');
const vfs = enb.asyncFs;

module.exports = inherit(enb.BaseTech, {
    getName() {
        return 'file-copy';
    },

    configure() {
        this._source = this.getOption('sourceTarget');
        if (!this._source) {
            this._source = this.getRequiredOption('source');
        }

        this._sourceNode = this.getOption('sourceNode');

        this._target = this.getOption('destTarget');
        if (!this._target) {
            this._target = this.getRequiredOption('target');
        }
    },

    getTargets() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build() {
        const _this = this;
        const node = this.node;
        const target = node.unmaskTargetName(this._target);
        const cache = node.getNodeCache(target);
        const targetPath = node.resolvePath(target);
        const sourceNode = this._sourceNode
        const requirements = {};
        let source, sourcePath, requireSources;

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
                return vfs.read(sourcePath, 'utf8').then(function (data) {
                    return vfs.write(targetPath, data, 'utf8').then(function () {
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
