'use strict'

/**
 * symlink
 * =======
 *
 * Создает симлинк из одного таргета в другой. Может, например,
 * использоваться для построения `_?.css` из `?.css` для development-режима.
 *
 * **Опции**
 *
 * * *String* **fileTarget** — Исходный таргет. Обязательная опция.
 * * *String* **symlinkTarget** — Результирующий таргет. Обязательная опция.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/symlink'), {
 *   fileTarget: '?.css',
 *   symlinkTarget: '_?.css'
 * } ]);
 * ```
 */
const inherit = require('inherit');

const enb = require('../lib/api');
const vfs = enb.asyncFs;

module.exports = inherit(enb.BaseTech, {
    getName() {
        return 'symlink';
    },

    configure() {
        this._symlinkTarget = this.getRequiredOption('symlinkTarget');
        this._fileTarget = this.getRequiredOption('fileTarget');
    },

    getTargets() {
        return [this.node.unmaskTargetName(this._symlinkTarget)];
    },

    build() {
        const symlinkTarget = this.node.unmaskTargetName(this._symlinkTarget);
        const symlinkTargetPath = this.node.resolvePath(symlinkTarget);
        const fileTarget = this.node.unmaskTargetName(this._fileTarget);
        const _this = this;
        function createSymlink() {
            return vfs.symLink(fileTarget, symlinkTargetPath).then(() => {
                _this.node.resolveTarget(symlinkTarget);
            });
        }
        return this.node.requireSources([fileTarget]).then(() => {
            return vfs.exists(symlinkTargetPath).then(exists => {
                if (exists) {
                    return vfs.remove(symlinkTargetPath).then(createSymlink);
                } else {
                    return createSymlink();
                }
            });
        });
    }
});
