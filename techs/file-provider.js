var fs = require('fs'), Vow = require('vow'), inherit = require('inherit');

module.exports = inherit({

    __constructor: function(suffix) {
        this._suffix = suffix;
    },

    getName: function() {
        return 'file-provider';
    },

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName(this._suffix)];
    },

    build: function() {
        var promise, target, targetPath,
            _this = this;
        promise = Vow.promise();
        target = this.node.getTargetName(this._suffix);
        targetPath = this.node.resolvePath(target);
        fs.exists(targetPath, function(exists) {
            if (exists) {
                _this.node.resolveTarget(target);
            } else {
                _this.node.rejectTarget(target, new Error('File not found: ' + targetPath));
            }
            return promise.fulfill();
        });
        return promise;
    },

    clean: function() {}
});
