var fs = require('fs'), Vow = require('vow');

function BemdeclTech() {}

BemdeclTech.prototype = {

    getName: function() {
        return 'bemdecl';
    },

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('bemdecl.js')];
    },

    build: function() {
        var promise, target, targetPath,
            _this = this;
        promise = Vow.promise();
        target = this.node.getTargetName('bemdecl.js');
        targetPath = this.node.resolvePath(target);
        fs.exists(targetPath, function(exists) {
            if (exists) {
                _this.node.resolveTarget(target, require(targetPath));
            } else {
                _this.node.rejectTarget(target, new Error('File not found: ' + targetPath));
            }
            return promise.fulfill();
        });
        return promise;
    },

    clean: function() {}
};

module.exports = BemdeclTech;
