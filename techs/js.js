var fs = require('fs'),
    Vow = require('vow');

function JsTech() {}

JsTech.prototype = {
    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('js')];
    },

    build: function() {
        var promise = Vow.promise(),
            _this = this;
        try {
            var target = this.node.getTargetName('js'),
                targetPath = this.node.resolvePath(target);
            this.node.requireSources([this.node.getTargetName('files')]).spread((function(files) {
                try {
                    var res = [],
                        filesBySuffix = files.getBySuffix('js');
                    for (var i = 0, l = filesBySuffix.length; i < l; i++) {
                        res.push('include("' + filesBySuffix[i].fullname + '");');
                    }
                    fs.writeFileSync(targetPath, res.join('\n'), "utf8");
                    _this.node.resolveTarget(target);
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
    }
};

module.exports = JsTech;
