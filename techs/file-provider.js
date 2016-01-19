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
var inherit = require('inherit'),
    _ = require('lodash'),
    enb = require('../lib/api'),
    vfs = enb.asyncFs;

module.exports = inherit(enb.BaseTech, {
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
                    node.resolveTarget(target, {path: filename, content: require('fs').readFileSync(filename, 'utf8')});
                } else {
                    node.rejectTarget(target, new Error('file not found: ' + filename));
                }
            }, _.noop);
    },

    clean: _.noop
});
