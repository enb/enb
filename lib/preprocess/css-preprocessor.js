var inherit = require('inherit'),
    path = require('path'),
    fs = require('fs');

module.exports = inherit({
    __constructor: function() {
        this._buildCssRelativeUrl = function(url, filename) {
            return url;
        };
    },
    setCssRelativeUrlBuilder: function(builder) {
        this._buildCssRelativeUrl = builder;
    },
    preprocess: function(data, filename) {
        return this._processIncludes(this._processUrls(data, filename), filename);
    },
    preprocessIncludes: function(data, filename) {
        return this._processIncludes(data, filename);
    },
    _processUrls: function(data, filename) {
        var _this = this;
        return data
            .replace(/(?:@import\s*)?url\(["']?([^"'\)]+)["']?\)/g, function(s, url) {
                if (s.indexOf('@import') === 0) {
                    return s;
                }
                return 'url(' + _this._resolveCssUrl(url, filename) + ')';
            });
    },
    _resolveCssUrl: function(url, filename) {
        if (url.substr(0, 5) === 'data:' || url.substr(0, 2) === '//' || ~url.indexOf('http://') || ~url.indexOf('https://')) {
            return url;
        } else {
            return this._buildCssRelativeUrl(url, filename);
        }
    },
    _processIncludes: function(data, filename) {
        var _this = this;
        return data.replace(/@import\s*(?:["']|url\()([^"'\)]+)["'\)]\s*;/g, function(s, url){
            var importFilename = path.resolve(path.dirname(filename), url),
                rootRelImportFilename = importFilename.slice(1),
                pre = '/* ' + rootRelImportFilename + ': begin */ /**/\n',
                post = '\n/* ' + rootRelImportFilename + ': end */ /**/\n';
            return pre +
                '    ' + _this.preprocess(fs.readFileSync(importFilename, "utf8"), importFilename)
                    .replace(/\n/g, '\n    ')
                 + post;
        });
    }
});