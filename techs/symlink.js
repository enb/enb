var fs = require('fs'), Vow = require('vow'), vowFs = require('vow-fs'), inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'symlink';
    },

    init: function(node) {
        this.__base(node);
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
            fileTargetPath = this.node.resolvePath(fileTarget),
            _this = this;
        function createSymlink() {
            return vowFs.symLink(fileTargetPath, symlinkTargetPath).then(function() {
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