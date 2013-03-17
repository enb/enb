var fs = require('fs'),
    inherit = require('inherit');

function CacheStorage(filename) {
    this._filename = filename;
    this._data = {};
    this._mtime = 0;
}

CacheStorage.prototype = {
    load: function() {
        if (fs.existsSync(this._filename)) {
            delete require.cache[this._filename];
            this._data = require(this._filename);
            this._mtime = +fs.statSync(this._filename).mtime;
        } else {
            this._data = {};
        }
    },
    reloadIfInvalid: function() {
        if (+fs.statSync(this._filename).mtime != this._mtime) {
            this.load();
        }
    },
    save: function() {
        fs.writeFileSync(this._filename, 'module.exports = ' + JSON.stringify(this._data) + ';', 'utf8');
        this._mtime = +fs.statSync(this._filename).mtime;
    },
    get: function(prefix, key) {
        return this._data[prefix] && this._data[prefix][key];
    },
    set: function(prefix, key, value) {
        (this._data[prefix] || (this._data[prefix] = {}))[key] = value;
    },
    invalidate: function(prefix, key) {
        var prefixObj = this._data[prefix];
        if (prefixObj) {
            delete prefixObj[key];
        }
    },
    dropPrefix: function(prefix) {
        delete this._data[prefix];
    },
    drop: function() {
        this._data = {};
    }
};

module.exports = CacheStorage;