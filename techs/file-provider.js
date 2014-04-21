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
var fs = require('fs');
var Vow = require('vow');
var inherit = require('inherit');

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
        var promise;
        var target;
        var targetPath;
        var _this = this;
        promise = Vow.promise();
        target = this.node.unmaskTargetName(this._target);
        targetPath = this.node.resolvePath(target);
        fs.exists(targetPath, function (exists) {
            if (exists) {
                _this.node.resolveTarget(target);
            } else {
                _this.node.rejectTarget(target, new Error('File not found: ' + targetPath));
            }
            return promise.fulfill();
        });
        return promise;
    },

    clean: function () {}
});
