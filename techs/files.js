var fs = require('fs'),
    Vow = require('vow'),
    FileList = require('../lib/file-list'),
    inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech.js'), {
    getName: function() {
        return 'files';
    },
    getTargets: function() {
        return [
            this.node.getTargetName('files'),
            this.node.getTargetName('dirs'),
            this.node.getTargetName('files-and-dirs')
        ];
    },
    build: function() {
        var _this = this,
            filesTarget = this.node.getTargetName('files'),
            dirsTarget = this.node.getTargetName('dirs'),
            filesAndDirsTarget = this.node.getTargetName('files-and-dirs');
        return this.node.requireSources([this.node.getTargetName('deps.js'), this.node.getTargetName('levels')])
            .spread(function(deps, levels) {
                var files = new FileList(), dirs = new FileList(), filesAndDirs = new FileList();
                for (var i = 0, l = deps.length; i < l; i++) {
                    var dep = deps[i], entities;
                    if (dep.elem) {
                        entities = levels.getElemEntities(dep.block, dep.elem, dep.mod, dep.val);
                    } else {
                        entities = levels.getBlockEntities(dep.block, dep.mod, dep.val);
                    }
                    files.addFiles(entities.files);
                    dirs.addFiles(entities.dirs);
                    filesAndDirs.addFiles(entities.files);
                    filesAndDirs.addFiles(entities.dirs);
                }
                _this.node.getLogger().logAction('files', files.items.length);
                _this.node.resolveTarget(filesTarget, files);
                _this.node.resolveTarget(dirsTarget, dirs);
                _this.node.resolveTarget(filesAndDirsTarget, filesAndDirs);
            });
    },

    clean: function() {}
});