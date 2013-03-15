var fs = require('fs'),
    inherit = require('inherit');

module.exports = inherit({
    __constructor: function() {
        this.items = [];
        this.bySuffix = {};
    },

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
    },
    parseFilename: parseFilename
}, {
    parseFilename: parseFilename
});

function parseFilename(filename) {
    var filenameParts = filename.split('.'),
        filenameWithoutSuffix = filenameParts[0],
        suffix = filenameParts.slice(1).join('.'),
        bem = {},
        modParts;
    if (~filenameWithoutSuffix.indexOf('__')) {
        var blockElemParts = filenameWithoutSuffix.split('__');
        bem.block = blockElemParts[0];
        var elemParts = blockElemParts[1].split('_');
        bem.elem = elemParts[0];
        modParts = elemParts.slice(1);
    } else {
        var blockParts = filenameWithoutSuffix.split('_');
        bem.block = blockParts[0];
        modParts = blockParts.slice(1);
    }
    if (modParts.length) {
        bem.modName = modParts[0];
        bem.modVal = modParts[1] || '';
    }
    var bemdecl = {
        name: bem.block
    };
    if (bem.elem) {
        if (bem.modName) {
            bemdecl.elems = [{ name: bem.elem, mods: [{ name: bem.modName, vals: [ bem.modVal ] }]}];
        } else {
            bemdecl.elems = [{ name: bem.elem }];
        }
    } else if (bem.modName) {
        bemdecl.mods = [{ name: bem.modName, vals: [ bem.modVal ] }];
    }
    return {
        filenameWithoutSuffix: filenameWithoutSuffix,
        suffix: suffix,
        bem: bem,
        bemdecl: bemdecl
    };
}

function filterFiles(filenames) {
    return filenames.filter(function(filename) {
        return filename.charAt(0) != '.';
    });
}

function getSuffix(filename) {
    return filename.split('.').slice(1).join('.');
}