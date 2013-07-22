/**
 * FileList
 * ========
 */
var fs = require('graceful-fs'),
    vowFs = require('./fs/async-fs'),
    Vow = require('vow'),
    inherit = require('inherit'),
    path = require('path');

/**
 * FileList — класс для работы со списком файлов.
 * Умеет быстро выдавать файлы по суффиксу.
 * @name FileList
 * @class
 */
module.exports = inherit({

    /**
     * Конструктор.
     */
    __constructor: function() {
        this.items = [];
        this.slices = [];
        this.bySuffix = {};
    },

    /**
     * Добавляет файлы в FileList.
     * Каждый файл описывается в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     * @param {Object[]} files
     */
    addFiles: function(files) {
        this.slices.push(files);
        for (var i = 0, l = files.length; i < l; i++) {
            var file = files[i];
            this.items.push(file);
            (this.bySuffix[file.suffix] || (this.bySuffix[file.suffix] = [])).push(file);
        }
    },

    /**
     * Возвращает файлы по суффиксу.
     * Каждый файл описывается в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     * @param {String|String[]} suffix.
     * @returns {Object[]}
     */
    getBySuffix: function(suffix) {
        if (Array.isArray(suffix) && suffix.length === 1) {
            suffix = suffix[0];
        }
        if (Array.isArray(suffix)) {
            var res = [];
            this.slices.forEach(function(slice) {
                suffix.forEach(function(s) {
                    for (var i = 0, l = slice.length; i < l; i++) {
                        var file = slice[i];
                        if (file.suffix === s) {
                            res.push(file);
                        }
                    }
                });
            });
            return res;
        } else {
            return this.bySuffix[suffix] || [];
        }
    },

    /**
     * Возвращает файлы по имени.
     * Каждый файл описывается в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     * @param {String} name.
     * @returns {Object[]}
     */
    getByName: function(name) {
        return this.items.filter(function(file) {
            return file.name === name;
        });
    },

    /**
     * Синхронно загружает список файлов из директории.
     * @param {String} dirname Абсолютный путь к директории.
     * @param {Boolean} recursive Рекурсивная загрузка.
     */
    loadFromDirSync: function(dirname, recursive) {
        var files = [], _this = this;
        filterFiles(fs.readdirSync(dirname)).forEach(function(filename) {
            var fullname = dirname + '/' + filename,
                stat = fs.statSync(fullname);
            if (stat.isFile()) {
                files.push({
                    name: filename,
                    fullname: fullname,
                    suffix: getSuffix(filename),
                    mtime: stat.mtime.getTime()
                });
            } else if (stat.isDirectory()) {
                if (recursive) {
                    _this.loadFromDirSync(fullname, recursive);
                }
            }
        });
        this.addFiles(files);
    },

    /**
     * Асинхронно загружает список файлов из директории.
     * @param {String} dirname Абсолютный путь к директории.
     * @param {Boolean} recursive Рекурсивная загрузка.
     * @returns {Promise}
     */
    loadFromDir: function(dirname, recursive) {
        var _this = this;
        return this._loadFromDir(dirname, recursive).then(function(files) {
            _this.addFiles(files);
        });
    },

    /**
     * Асинхронно загружает список файлов из директории.
     * @param {String} dirname
     * @param {Boolean} recursive
     * @returns {Promise}
     * @private
     */
    _loadFromDir: function(dirname, recursive) {
        var _this = this;
        return vowFs.listDir(dirname).then(function(filenames) {
            return Vow.all(filenames.map(function(filename) {
                var fullname = dirname + '/' + filename;
                return vowFs.stat(fullname).then(function(stat) {
                    if (stat.isFile()) {
                        return [{
                            name: filename,
                            fullname: fullname,
                            suffix: getSuffix(filename),
                            mtime: stat.mtime.getTime()
                        }];
                    } else if (stat.isDirectory()) {
                        if (recursive) {
                            return _this._loadFromDir(fullname, recursive);
                        }
                    }
                    return [];
                });
            }));
        }).then(function(fileLists) {
            return [].concat.apply([], fileLists);
        });
    },

    /**
     * Разбирает имя файла, извлекая данные BEM-сущности.
     * Формат ответа:
     * {
     *   filenameWithoutSuffix: <имя файла без суффикса>,
     *   suffix: <суффикс>,
     *   bem: {
     *       block: ...,
     *       elem: ...,
     *       modName: ...,
     *       modVal: ...
     *   },
     *   bemdecl: <bemdecl-формат>
     * };
     * @returns {Object}
     */
    parseFilename: parseFilename,

    /**
     * Возвращает информацию о файле в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     */
    getFileInfo: getFileInfo
}, {
    parseFilename: parseFilename,
    getFileInfo: getFileInfo
});

function getFileInfo(filename) {
    var baseName = path.basename(filename),
        suffix = baseName.split('.').slice(1).join('.'),
        stat = fs.statSync(filename);
    return {
        name: baseName,
        fullname: filename,
        suffix: suffix,
        mtime: stat.mtime.getTime(),
        isDirectory: stat.isDirectory()
    };
}

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
            bemdecl.elems = [{ name: bem.elem, mods: [{ name: bem.modName, vals: [ {name: bem.modVal} ] }]}];
        } else {
            bemdecl.elems = [{ name: bem.elem }];
        }
    } else if (bem.modName) {
        bemdecl.mods = [{ name: bem.modName, vals: [ {name: bem.modVal} ] }];
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
        return filename.charAt(0) !== '.';
    });
}

function getSuffix(filename) {
    return filename.split('.').slice(1).join('.');
}
