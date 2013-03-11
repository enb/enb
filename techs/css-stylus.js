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
        var _this = this;
        return Vow.all(sourceFiles.map(function(file) {
            if (file.suffix == 'styl') {
                return vowFs.read(file.fullname, "utf8").then(function(stylusFileContent) {
                    var promise = Vow.promise();
                    stylus(stylusFileContent)
                        .set('filename', file.fullname)
                        .render(function(err, css) {
                            if (err) return promise.reject(err);
                            return promise.fulfill(_this._processUrls(css, file.fullname));
                        });
                    return promise;
                });
            } else {
                return vowFs.read(file.fullname, "utf8").then(function(cssFileContent) {
                    return _this._processCss(cssFileContent, file.fullname);
                });
            }
        })).then(function(results) {
            return results.join('\n');
        });
    }
});