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
var vfs = require('../lib/fs/async-fs'),
    inherit = require('inherit'),
    _ = require('lodash');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'file-provider';
    },

    configure: function () {
        this._target = this.getRequiredOption('target');
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var node = this.node,
            target = node.unmaskTargetName(this._target),
            filename = node.resolvePath(target);

        return vfs.exists(filename)
            .then(function (exists) {
                if (exists) {
                    node.resolveTarget(target);
                } else {
                    node.rejectTarget(target, new Error('file not found: ' + filename));
                }
            }, _.noop);
    },

    clean: _.noop
});
