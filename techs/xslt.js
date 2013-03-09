var fs = require('fs'),
    Vow = require('vow'),
    inherit = require('inherit'),
    childProcess = require('child_process');

module.exports = inherit({
    __constructor: function(sourceSuffix, destSuffix, xslFile, args) {
        this._sourcePrefix = sourceSuffix;
        this._destSuffix = destSuffix;
        this._xslFile = xslFile;
        this._args = args || [];
    },

    getName: function() {
        return 'xslt';
    },

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName(this._destSuffix)];
    },

    build: function() {
        var _this = this,
            promise = Vow.promise(),
            source = this.node.getTargetName(this._sourcePrefix),
            sourcePath = this.node.resolvePath(source),
            target = this.node.getTargetName(this._destSuffix),
            targetPath = this.node.resolvePath(target);
        this.node.requireSources([source]).then(function() {
            var args = _this._args.concat([_this._xslFile, sourcePath]);
            childProcess.execFile('/usr/bin/xsltproc', args, {}, function(err, stdout, stderr) {
                if (err) return promise.reject(err);
                fs.writeFile(targetPath, stdout, "utf8", function() {
                    if (err) return promise.reject(err);
                    _this.node.resolveTarget(target);
                    promise.fulfill();
                });
            });
        });
        return promise;
    },

    clean: function() {}
});
