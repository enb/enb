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
        var _this = this;
        return data
            .replace(/(?:@import\s*)?url\(([^\)]+)\)/, function(s, url) {
                if (s.indexOf('@import') === 0) {
                    return s;
                }
                if (url.substr(0, 2) == '//' || ~url.indexOf('http://') || ~url.indexOf('https://')) {
                    return s;
                } else {
                    var urlFilename = path.resolve(path.dirname(filename), url);
                    return 'url(' + _this.node.relativePath(urlFilename) + ')';
                }
            })
            .replace(/@import\s*(?:["']|url\()([^"'\)]+)["'\)]\s*;/g, function(s, url){
                var importFilename = path.resolve(path.dirname(filename), url);
                var rootRelImportFilename = importFilename.slice(1);
                pre = '/* ' + rootRelImportFilename + ': begin */ /**/\n'
                post = '\n/* ' + rootRelImportFilename + ': end */ /**/\n'
               return pre + 
                    '    ' + _this._processCss(fs.readFileSync(importFilename, "utf8"), importFilename)
                        .replace(/\n/g, '\n    ')
                     + post;
            });
    }
});
