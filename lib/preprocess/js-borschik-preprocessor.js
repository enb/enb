var inherit = require('inherit'),
    path = require('path'),
    fs = require('fs');

module.exports = inherit({
    __constructor: function() {
        this._buildRelativeLink = function(url, filename) {
            return url;
        };
    },
    setRelativeLinkBuilder: function(builder) {
        this._buildRelativeLink = builder;
    },
    preprocess: function(data, filename) {
        return this._processIncludes(this._processLinks(data, filename), filename);
    },
    _processLinks: function(data, filename) {
        var _this = this;
        return data
            .replace(/['"]borschik:link:([^"']+)['"]/g, function(s, url) {
                return JSON.stringify(_this._buildRelativeLink(url, filename));
            });
    },
    _processIncludes: function(data, filename) {
        var _this = this;
        return data.replace(/['"]borschik:include:([^"']+)['"]/g, function(s, url){
            var importFilename = path.resolve(path.dirname(filename), url);
            return JSON.stringify(_this.preprocess(fs.readFileSync(importFilename, "utf8"), importFilename));
        });
    }
});