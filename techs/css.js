var fs = require('fs'),
    Vow = require('vow');

function CssTech() {}

CssTech.prototype = {

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('css')];
    },

    build: function() {
        var promise = Vow.promise(), _this = this;
        try {
            var target = this.node.getTargetName('css'),
                targetPath = this.node.resolvePath(target);
            this.node.requireSources([this.node.getTargetName('files')]).spread((function(files) {
                try {
                    var res = [];
                    var filesBySuffix = files.getBySuffix('css');
                    for (var i = 0, l = filesBySuffix.length; i < l; i++) {
                        res.push(fs.readFileSync(filesBySuffix[i].fullname, "utf8"));
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

module.exports = CssTech;