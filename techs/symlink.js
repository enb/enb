var fs = require('fs'), Vow = require('vow'), vowFs = require('vow-fs'), inherit = require('inherit');

module.exports = inherit({
    __constructor: function(symlinkTarget, fileTarget) {
        this._symlinkTarget = symlinkTarget;
        this._fileTarget = fileTarget;
    },

    getName: function() {
        return 'symlink';
    },

    init: function(node) {
        this.node = node;
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
    },

    clean: function() {
        var _this = this;
        return Vow.all(this.getTargets().map(function(target) {
            _this.node.cleanTargetFile(target);
        }));
    }
});