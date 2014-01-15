/**
 * files
 * =====
 *
 * Собирает список исходных файлов для сборки на основе *deps* и *levels*, предоставляет `?.files` и `?.dirs`.
 * Используется многими технологиями, которые объединяют множество файлов из различных уровней переопределения в один.
 *
 * **Опции**
 *
 * * *String* **depsTarget** — Исходный deps-таргет. По умолчанию — `?.deps.js`.
 * * *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
 * * *String* **filesTarget** — Результирующий files-таргет. По умолчанию — `?.files`.
 * * *String* **dirsTarget** — Результирующий dirs-таргет. По умолчанию — `?.dirs`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/files'));
 * ```
 */
var fs = require('graceful-fs'),
    Vow = require('vow'),
    FileList = require('../lib/file-list'),
    inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech.js'), {
    configure: function () {
        this._depsTarget = this.node.unmaskTargetName(this.getOption('depsTarget', '?.deps.js'));
        this._filesTarget = this.node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._dirsTarget = this.node.unmaskTargetName(this.getOption('dirsTarget', '?.dirs'));
        this._levelsTarget = this.node.unmaskTargetName(this.getOption('levelsTarget', '?.levels'));
    },
    getName: function () {
        return 'files';
    },
    getTargets: function () {
        return [
            this._filesTarget,
            this._dirsTarget
        ];
    },
    build: function () {
        var _this = this,
            filesTarget = this._filesTarget,
            dirsTarget = this._dirsTarget;
        return this.node.requireSources([this._depsTarget, this._levelsTarget])
            .spread(function (deps, levels) {
                var files = new FileList(), dirs = new FileList();
                for (var i = 0, l = deps.length; i < l; i++) {
                    var dep = deps[i], entities;
                    if (dep.elem) {
                        entities = levels.getElemEntities(dep.block, dep.elem, dep.mod, dep.val || '');
                    } else {
                        entities = levels.getBlockEntities(dep.block, dep.mod, dep.val || '');
                    }
                    files.addFiles(entities.files);
                    dirs.addFiles(entities.dirs);
                }
                _this.node.resolveTarget(filesTarget, files);
                _this.node.resolveTarget(dirsTarget, dirs);
            });
    },

    clean: function () {}
});
