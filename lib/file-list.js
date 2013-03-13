var fs = require('fs');

function FileList() {
    this.items = [];
    this.bySuffix = {};
}

FileList.prototype = {
    addFiles: function(files) {
        for (var i = 0, l = files.length; i < l; i++) {
            var file = files[i];
            this.items.push(file);
            (this.bySuffix[file.suffix] || (this.bySuffix[file.suffix] = [])).push(file)
        }
    },

    getBySuffix: function(suffix) {
        if (Array.isArray(suffix)) {
            var res = [], items = this.items;
            for (var i = 0, l = items.length; i < l; i++) {
                if (suffix.indexOf(items[i].suffix) != -1) {
                    res.push(items[i]);
                }
            }
            return res;
        } else {
            return this.bySuffix[suffix] || [];
        }
    },

    getByName: function(name) {
        return this.items.filter(function(file) {
            return file.name == name;
        });
    },

    loadFromDirSync: function(dirname, recursive) {
        var files = [], _this = this;
        filterFiles(fs.readdirSync(dirname)).forEach(function(filename) {
            var fullname = dirname + '/' + filename,
                stat = fs.statSync(fullname);
            if (stat.isFile(fullname)) {
                files.push({
                    name: filename,
                    fullname: fullname,
                    suffix: getSuffix(filename),
                    mtime: +stat.mtime
                });
            } else if (stat.isDirectory()) {
                recursive && _this.loadFromDirSync(fullname);
            }
        });
        this.addFiles(files);
    }
};

function filterFiles(filenames) {
    return filenames.filter(function(filename) {
        return filename.charAt(0) != '.';
    });
}

function getSuffix(filename) {
    return filename.split('.').slice(1).join('.');
}

module.exports = FileList;