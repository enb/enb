/**
 * Levels
 * ======
 */
var inherit = require('inherit');

/**
 * Levels — класс для работы со списком уровней переопределения.
 * @name Levels
 */
module.exports = inherit({
    /**
     * Конструктор.
     * @param {Level[]} items Уровни переопределения.
     */
    __constructor: function (items) {
        this.items = items;
    },

    /**
     * Возвращает объектные представления блоков по имени.
     * @param {String} blockName
     * @returns {Object[]}
     */
    getBlocks: function (blockName) {
        var block;
        var blocks = [];
        for (var i = 0, l = this.items.length; i < l; i++) {
            block = this.items[i].blocks[blockName];
            if (block) {
                blocks.push(block);
            }
        }
        return blocks;
    },

    /**
     * Возвращает объектные представления элементов по имени.
     * @param {String} blockName
     * @param {String} elemName
     * @returns {Object[]}
     */
    getElems: function (blockName, elemName) {
        var block;
        var elements = [];
        for (var i = 0, l = this.items.length; i < l; i++) {
            block = this.items[i].blocks[blockName];
            if (block && block.elements[elemName]) {
                elements.push(block.elements[elemName]);
            }
        }
        return elements;
    },

    /**
     * Возвращает файлы и директории по декларации блока.
     * @param {String} blockName
     * @param {String} modName
     * @param {String} modVal
     * @returns {{files: Array, dirs: Array}}
     */
    getBlockEntities: function (blockName, modName, modVal) {
        var block;
        var files = [];
        var dirs = [];
        var blocks = this.getBlocks(blockName);
        for (var i = 0, l = blocks.length; i < l; i++) {
            block = blocks[i];
            if (modName) {
                if (block.mods[modName] && block.mods[modName][modVal || '']) {
                    files = files.concat(block.mods[modName][modVal || ''].files);
                    dirs = dirs.concat(block.mods[modName][modVal || ''].dirs);
                }
            } else {
                files = files.concat(block.files);
                dirs = dirs.concat(block.dirs);
            }
        }
        return {files: files, dirs: dirs};
    },

    /**
     * Возвращает файлы и директории по декларации элемента.
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     * @returns {{files: Array, dirs: Array}}
     */
    getElemEntities: function (blockName, elemName, modName, modVal) {
        var elem;
        var files = [];
        var dirs = [];
        var elems = this.getElems(blockName, elemName);
        for (var i = 0, l = elems.length; i < l; i++) {
            elem = elems[i];
            if (modName) {
                if (elem.mods[modName] && elem.mods[modName][modVal || '']) {
                    files = files.concat(elem.mods[modName][modVal || ''].files);
                    dirs = dirs.concat(elem.mods[modName][modVal || ''].dirs);
                }
            } else {
                files = files.concat(elem.files);
                dirs = dirs.concat(elem.dirs);
            }
        }
        return {files: files, dirs: dirs};
    },

    /**
     * Возвращает файлы по декларации блока.
     * Каждый файл описывается в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     * @param {String} blockName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Object[]}
     */
    getBlockFiles: function (blockName, modName, modVal) {
        return this.getBlockEntities(blockName, modName, modVal).files;
    },

    /**
     * Возвращает файлы по декларации элемента.
     * Каждый файл описывается в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Object[]}
     */
    getElemFiles: function (blockName, elemName, modName, modVal) {
        return this.getElemEntities(blockName, elemName, modName, modVal).files;
    },

    /**
     * Возвращает файлы на основе декларации.
     * Каждый файл описывается в виде:
     * { fullname: <абсолютный путь к файлу>, name: <имя файла>, suffix: <суффикс>, mtime: <время изменения> }
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Object[]}
     */
    getFilesByDecl: function (blockName, elemName, modName, modVal) {
        if (elemName) {
            return this.getElemFiles(blockName, elemName, modName, modVal);
        } else {
            return this.getBlockFiles(blockName, modName, modVal);
        }
    },

    /**
     * Возвращает файлы на основе суффикса.
     * @param {String} suffix
     * @returns {Object[]}
     */
    getFilesBySuffix: function (suffix) {
        var files = [];
        this.items.forEach(function (level) {
            var blocks = level.blocks;
            Object.keys(blocks).forEach(function (blockName) {
                files = files.concat(getFilesInElementBySuffix(blocks[blockName], suffix));
            });
        });
        return files;
    },

    /**
     * Возвращает значения модификатора для блока.
     *
     * @param {String} blockName
     * @param {String} modName
     * @returns {String[]}
     */
    getModValues: function (blockName, modName) {
        var modVals = [];
        this.items.forEach(function (level) {
            var blockInfo = level.blocks[blockName];
            if (blockInfo && blockInfo.mods && blockInfo.mods[modName]) {
                modVals = modVals.concat(Object.keys(blockInfo.mods[modName]));
            }
        });
        return modVals;
    }
});

function getFilesInElementBySuffix(element, suffix) {
    var files = element.files.filter(function (f) { return f.suffix === suffix; });
    var mods = element.mods;
    var elements = element.elements;
    Object.keys(mods).forEach(function (modName) {
        var mod = mods[modName];
        Object.keys(mod).forEach(function (modVal) {
            files = files.concat(mod[modVal].files.filter(function (f) { return f.suffix === suffix; }));
        });
    });
    if (elements) {
        Object.keys(elements).forEach(function (elemName) {
            files = files.concat(getFilesInElementBySuffix(elements[elemName], suffix));
        });
    }
    return files;
}
