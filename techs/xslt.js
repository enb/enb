var fs = require('fs'),
    Vow = require('vow'),
    inherit = require('inherit'),
    childProcess = require('child_process'),
    Vow = require('vow');

// TODO: кэширование
module.exports = inherit({
    __constructor: function(sourceSuffix, destSuffix, options) {
        this._options = options || {};
        this._sourcePrefix = sourceSuffix;
        this._destSuffix = destSuffix;
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
            options = this._options,
            promise = Vow.promise(),
            source = this.node.getTargetName(this._sourcePrefix),
            sourcePath = this.node.resolvePath(source),
            target = this.node.getTargetName(this._destSuffix),
            targetPath = this.node.resolvePath(target),
            sources = [source],
            xslFile = options.xslFile;

        if (options.xslSource) {
            var xslSource = options.xslSource;
            xslSource = this.node.unmaskTargetName(xslSource);
            xslFile = this.node.resolvePath(xslSource);
            sources.push(xslSource);
        }

        function saveFile(text) {
            fs.writeFile(targetPath, text, "utf8", function(err) {
                if (err) return promise.reject(err);
                _this.node.resolveTarget(target);
                promise.fulfill();
            });
        }

        this.node.requireSources(sources).then(function() {
            var args = (options.args || []).concat([xslFile, sourcePath]);
            childProcess.execFile('/usr/bin/xsltproc', args, {}, function(err, xsltStdout, stderr) {
                if (err) return promise.reject(err);
                if (options.xmlLint) {
                    var xmlLintArgs = (options.xmlLintArgs || []).concat(['-']),
                        xmlLintProcess = childProcess.spawn('/usr/bin/xmllint', xmlLintArgs),
                        output = '';
                    xmlLintProcess.on('exit', function(code) {
                        if (code === 0) {
                            saveFile(output);
                        } else {
                            var err = new Error('xmllint exited with code ' + code);
                            promise.reject(err);
                            _this.node.rejectTarget(target, err);
                        }
                    });
                    xmlLintProcess.stdout.on('data', function(data) {
                        output += data;
                    });
                    xmlLintProcess.stdin.write(xsltStdout);
                    xmlLintProcess.stdin.end();
                } else {
                    saveFile(xsltStdout);
                }
            });
        });
        return promise;
    },

    clean: function() {
        var _this = this;
        return Vow.all(this.getTargets().map(function(target) {
            _this.node.cleanTargetFile(target);
        }));
    }
});
