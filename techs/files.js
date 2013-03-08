    var fs = require('fs'),
            Vow = require('vow'),
            FileList = require('../lib/file-list');

function FilesTech() {}

FilesTech.prototype = {
    getName: function() {
        return 'files';
    },

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('files')];
    },

    build: function() {
        var promise = Vow.promise(), _this = this;
        try {
            var target = this.node.getTargetName('files');
            this.node.requireSources([this.node.getTargetName('deps.js'), this.node.getTargetName('levels')])
                .spread((function(deps, levels) {
                    try {
                        var files = new FileList();
                        for (var i = 0, l = deps.length; i < l; i++) {
                            var dep = deps[i];
                            if (dep.elem) {
                                files.addFiles(levels.getElemFiles(dep.block, dep.elem, dep.mod, dep.val));
                            } else {
                                files.addFiles(levels.getBlockFiles(dep.block, dep.mod, dep.val));
                            }
                        }
                        _this.node.getLogger().logAction('files', files.items.length);
                        _this.node.resolveTarget(target, files);
                        return promise.fulfill();
                    } catch (err) {
                        return promise.reject(err);
                    }
                }), function(err) {
                    return promise.reject(err);
                });
        } catch (e) {
            promise.reject(e);
        }
        return promise;
    },

    clean: function() {}
};

module.exports = FilesTech;