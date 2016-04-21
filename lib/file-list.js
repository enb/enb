/**
 * FileList
 * ========
 */
var inherit = require('inherit'),
    getFileInfo = require('./fs/fs-util').getFileInfo;

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
    __constructor: function () {
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
    addFiles: function (files) {
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
    getBySuffix: function (suffix) {
        if (Array.isArray(suffix) && suffix.length === 1) {
            suffix = suffix[0];
        }
        if (Array.isArray(suffix)) {
            var res = [];
            this.slices.forEach(function (slice) {
                suffix.forEach(function (s) {
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
    getByName: function (name) {
        return this.items.filter(function (file) {
            return file.name === name;
        });
    },

    /**
     * Возвращает информацию о файле в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     */
    getFileInfo: getFileInfo
}, {
    getFileInfo: getFileInfo
});
