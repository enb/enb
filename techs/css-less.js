/**
 * css-less
 * ========
 *
 * Технология устарела и будет удалена.
 */
var Vow = require('vow');
var path = require('path');

module.exports = require('./css').buildFlow()
    .name('css-less')
    .deprecated('enb')
    .useFileList(['css', 'less'])
    .builder(function (sourceFiles) {
        var less;
        try {
            less = require('less');
        } catch (e) {
            throw new Error(
                'The technology "css-less" cannot be executed because the npm module "less" was not found.'
            );
        }

        var _this = this;
        var promise = Vow.promise();

        var css = sourceFiles.map(function (file) {
            return '@import "' + file.fullname + '";';
        }).join('\n');

        var targetName = _this._target;
        var parser = new(less.Parser)({
            filename: this.node.resolvePath(targetName),
            relativeUrls: true,
            rootpath: this.node.getPath()
        });

        var tree = require('less/lib/less/tree');
        tree._originURL = tree._originURL || tree.URL;

        var newURL = tree.URL = function (val, currentFileInfo) {
            this.value = val;
            this.currentFileInfo = currentFileInfo;
        };
        tree.URL.prototype = {
            type: 'Url',
            accept: function (visitor) {
                this.value = visitor.visit(this.value);
            },
            toCSS: function () {
                return 'url(' + this.value.toCSS() + ')';
            },
            eval: function (ctx) {
                /*jshint -W061 */
                var val = this.value.eval(ctx);
                var rootpath = this.currentFileInfo && this.currentFileInfo.rootpath;
                if (rootpath && typeof val.value === 'string' && ctx.isPathRelative(val.value)) {
                    if (!val.quote) {
                        rootpath = rootpath.replace(/[\(\)'"\s]/g, function (match) { return '\\' + match; });
                    }
                    var urlFilename = path.resolve(
                        path.dirname(this.currentFileInfo.filename),
                        val.value
                    );
                    var res = path.relative(rootpath, urlFilename);
                    if (res.charAt(0) !== '.') {
                        res = './' + res;
                    }
                    val.value = res;
                }
                return new(tree.URL)(val, null);
            }
        };

        parser.parse(css, function (err, tree) {
            if (err) {
                return promise.reject(err);
            }
            if (tree.URL === newURL) {
                tree.URL = tree._originURL;
            }
            return promise.fulfill(tree.toCSS());
        });

        return promise.then(function (css) {
            return _this._processIncludes(css, _this.node.resolvePath(targetName));
        });
    })
    .createTech();
