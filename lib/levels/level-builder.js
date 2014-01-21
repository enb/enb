/**
 * LevelBuilder
 * ============
 */
var inherit = require('inherit');
var fs = require('graceful-fs');
var Vow = require('vow');

/**
 * Построитель структуры уровня переопределения.
 *
 * @name LevelBuilder
 */
module.exports = inherit({
    /**
     * Конструктор.
     */
    __constructor: function () {
        this._blocks = {};
    },
    /**
     * Добавляет декларацию файла.
     * @param {String} filename
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     */
    addFile: function (filename, blockName, elemName, modName, modVal) {
        var baseName = filename.split('/').slice(-1)[0];
        var baseNameParts = baseName.split('.');
        var stat = fs.statSync(filename);
        var suffix = baseNameParts.slice(1).join('.');
        var fileInfo = {
                name: baseName,
                fullname: filename,
                suffix: suffix,
                mtime: stat.mtime.getTime(),
                isDirectory: stat.isDirectory()
            };
        if (fileInfo.isDirectory) {
            fileInfo.files = filterFiles(fs.readdirSync(filename)).map(function (subFilename) {
                var subFullname = filename + '/' + subFilename;
                var subStat = fs.statSync(subFullname);
                return {
                    name: subFilename,
                    fullname: subFullname,
                    suffix: subFilename.split('.').slice(1).join('.'),
                    mtime: subStat.mtime.getTime(),
                    isDirectory: subStat.isDirectory()
                };
            });
        }

        var block = this._blocks[blockName] || (this._blocks[blockName] = {
            name: blockName,
            files: [],
            dirs: [],
            elements: {},
            mods: {}
        });
        var destElement;
        if (elemName) {
            destElement = block.elements[elemName] || (block.elements[elemName] = {
                name: elemName,
                files: [],
                dirs: [],
                mods: {}
            });
        } else {
            destElement = block;
        }
        var collectionKey = fileInfo.isDirectory ? 'dirs' : 'files';
        if (modName) {
            var mod = destElement.mods[modName] || (destElement.mods[modName] = {});
            var modValueFiles = (mod[modVal] || (mod[modVal] = {files: [], dirs: []}))[collectionKey];
            modValueFiles.push(fileInfo);
        } else {
            destElement[collectionKey].push(fileInfo);
        }
    },
    /**
     * Возвращает структуру блоков/элементов/модификаторов.
     * @returns {Object}
     */
    getBlocks: function () {
        return this._blocks;
    },
    /**
     * Выполняет построение уровня переопределения.
     * @returns {Promise}
     */
    build: function () {
        return Vow.fulfill();
    }
});

function filterFiles(filenames) {
    return filenames.filter(function (filename) {
        return filename.charAt(0) !== '.';
    });
}
