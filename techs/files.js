/**
 * files
 * =====
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var FileList = require('../lib/file-list');
var inherit = require('inherit');

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
        var _this = this;
        var filesTarget = this._filesTarget;
        var dirsTarget = this._dirsTarget;
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'files', 'enb-bem-techs');

        return this.node.requireSources([this._depsTarget, this._levelsTarget])
            .spread(function (deps, levels) {
                var files = new FileList();
                var dirs = new FileList();
                for (var i = 0, l = deps.length; i < l; i++) {
                    var dep = deps[i];
                    var entities;
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
