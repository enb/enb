var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    stylus = require('stylus'),
    vowFs = require('vow-fs');

module.exports = inherit(require('./css'), {
    getName: function() {
        return 'css-stylus';
    },
    getSourceSuffixes: function() {
        return ['css', 'styl'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        var _this = this,
            promise = Vow.promise();

        var css = sourceFiles.map(function(file) {
            return '@import "' + file.fullname + '";';
        }).join('\n');

        stylus(css)
            .define('url', function(url){
                return new stylus.nodes.Literal('url(' + _this._resolveCssUrl(url.val, url.filename) + ')');
            })
            .set('filename', _this.node.resolvePath(_this.getTargetName(suffix)))
            .render(function(err, css) {
                if (err) promise.reject(err);
                promise.fulfill(css);
            });

        return promise.then(function(css) {
            return _this._processIncludes(css);
        });
    }
});