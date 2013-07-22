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
var fs = require('graceful-fs'),
    Vow = require('vow'),
    vowFs = require('../lib/fs/async-fs'),
    inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'symlink';
    },

    configure: function() {
        this._symlinkTarget = this.getRequiredOption('symlinkTarget');
        this._fileTarget = this.getRequiredOption('fileTarget');
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._symlinkTarget)];
    },

    build: function() {
        var symlinkTarget = this.node.unmaskTargetName(this._symlinkTarget),
            symlinkTargetPath = this.node.resolvePath(symlinkTarget),
            fileTarget = this.node.unmaskTargetName(this._fileTarget),
            _this = this;
        function createSymlink() {
            return vowFs.symLink(fileTarget, symlinkTargetPath).then(function() {
                _this.node.resolveTarget(symlinkTarget);
            });
        }
        return this.node.requireSources([fileTarget]).then(function() {
            return vowFs.exists(symlinkTargetPath).then(function(exists) {
                if (exists) {
                    return vowFs.remove(symlinkTargetPath).then(createSymlink);
                } else {
                    return createSymlink();
                }
            });
        });
    }
});
