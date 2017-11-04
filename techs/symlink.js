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
var inherit = require('inherit');

var enb = require('../lib/api');
var vfs = enb.asyncFs;

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
        var symlinkTarget = this.node.unmaskTargetName(this._symlinkTarget);
        var symlinkTargetPath = this.node.resolvePath(symlinkTarget);
        var fileTarget = this.node.unmaskTargetName(this._fileTarget);
        var _this = this;
        function createSymlink() {
            return vfs.symLink(fileTarget, symlinkTargetPath).then(function () {
                _this.node.resolveTarget(symlinkTarget);
            });
        }
        return this.node.requireSources([fileTarget]).then(function () {
            return vfs.exists(symlinkTargetPath).then(function (exists) {
                if (exists) {
                    return vfs.remove(symlinkTargetPath).then(createSymlink);
                } else {
                    return createSymlink();
                }
            });
        });
    }
});
