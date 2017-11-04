'use strict'

/**
 * file-provider
 * =============
 *
 * Предоставляет существующий файл для make-платформы.
 * Может, например, использоваться для предоставления исходного *bemdecl*-файла.
 *
 * **Опции**
 *
 * * *String* **target** — Таргет. Обязательная опция.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);
 * ```
 */
const inherit = require('inherit');

const enb = require('../lib/api');
const vfs = enb.asyncFs;

module.exports = inherit(enb.BaseTech, {
    getName() {
        return 'file-provider';
    },

    configure() {
        this._target = this.getRequiredOption('target');
    },

    getTargets() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build() {
        const node = this.node;
        const target = node.unmaskTargetName(this._target);
        const filename = node.resolvePath(target);

        return vfs.exists(filename)
            .then(function (exists) {
                if (exists) {
                    node.resolveTarget(target);
                } else {
                    node.rejectTarget(target, new Error('file not found: ' + filename));
                }
            }, () => {});
    },

    clean: () => {}
});
