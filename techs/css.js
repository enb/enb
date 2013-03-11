var inherit = require('inherit'),
    fs = require('fs'),
    path = require('path');
module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'css';
    },
    getDestSuffixes: function() {
        return ['css'];
    },
    getSourceSuffixes: function() {
        return ['css'];
    },
    getTargetName: function(suffix) {
        return '_' + this.node.getTargetName(suffix);
    },
    getBuildResult: function(sourceFiles, suffix) {
        var node = this.node;
        return this._processCss(sourceFiles.map(function(file) {
            return '@import "' + node.relativePath(file.fullname) + '";';
        }).join('\n'), node.resolvePath(this.getTargetName(suffix)));
    },
    _processCss: function(data, filename) {
        return this._processIncludes(this._processUrls(data, filename), filename);
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
            var urlFilename = path.resolve(path.dirname(filename), url);
            return this.node.relativePath(urlFilename);
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
                '    ' + _this._processCss(fs.readFileSync(importFilename, "utf8"), importFilename)
                    .replace(/\n/g, '\n    ')
                 + post;
        });
    }
});
