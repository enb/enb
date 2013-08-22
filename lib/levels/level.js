/**
 * Level
 * =====
 */
var inherit = require('inherit'),
    fs = require('graceful-fs'),
    Vow = require('vow'),
    LevelBuilder = require('./level-builder');

// TODO: Сделать 1-в-1 асинхронный аналог (с точно таким же порядком файлов на выходе).
/**
 * Level — объектная модель уровня переопределения.
 * @name Level
 */
module.exports = inherit({

    /**
     * Конструктор.
     * @param {String} path Путь к уровню переопределения.
     * @param {Function} [schemeBuilder]
     */
    __constructor: function(path, schemeBuilder) {
        this._path = path;
        this.blocks = {};
        this._loadPromise = null;
        this._schemeBuilder = schemeBuilder;
    },

    /**
     * Загружает из кэша.
     */
    loadFromCache: function(data) {
        this.blocks = data;
        this._loadPromise = Vow.fulfill(this);
    },

    /**
     * Возвращает структуру блоков.
     * @returns {Object}
     */
    getBlocks: function() {
        return this.blocks;
    },

    /**
     * Проверяет наличие блока с указанным именем.
     * @param blockName
     * @returns {Boolean}
     */
    hasBlock: function(blockName) {
        return this.blocks[blockName];
    },

    /**
     * Возвращает абсолютный путь к уровню переопределения.
     * @returns {String}
     */
    getPath: function() {
        return this._path;
    },

    /**
     * Обрабатывает файл, добавляет его в необходимое место в структуре.
     * @param {String} filename
     * @param {Object} stat node.js Stat
     * @param {String} parentElementName
     * @param {String} elementName
     * @param {String} modName
     * @private
     */
    _processFile: function(filename, stat, parentElementName, elementName, modName) {
        var requiredBaseNameWithoutExt = (parentElementName ? parentElementName + '__' : '') +
                elementName + (modName ? '_' + modName : ''),
            baseName = filename.split('/').slice(-1)[0],
            baseNameParts = baseName.split('.'),
            baseNameWithoutExt = stat.isDirectory() ?
                baseNameParts.slice(0, baseNameParts.length - 1).join('.') :
                baseNameParts[0],
            rl = requiredBaseNameWithoutExt.length,
            modVal;
        var processFile = baseNameWithoutExt.indexOf(requiredBaseNameWithoutExt) === 0 && (
                modName ?
                    (rl === baseNameWithoutExt.length) || baseNameWithoutExt.charAt(rl) === '_' :
                    baseNameWithoutExt === requiredBaseNameWithoutExt
            );
        if (!processFile && !modName && !parentElementName) {
            var baseNameModParts = baseNameWithoutExt.split('_');
            if (baseNameModParts.length === 2 && baseNameModParts[0] === requiredBaseNameWithoutExt) {
                processFile = true;
                modName = 'view';
                modVal = baseNameModParts[1];
            }
        }
        if (processFile) {
            var suffix = stat.isDirectory() ? baseNameParts.pop() : baseNameParts.slice(1).join('.'),
                fileInfo = {
                    name: baseName,
                    fullname: filename,
                    suffix: suffix,
                    mtime: stat.mtime.getTime(),
                    isDirectory: stat.isDirectory()
                };
            if (fileInfo.isDirectory) {
                fileInfo.files = filterFiles(fs.readdirSync(filename)).map(function(subFilename) {
                    var subFullname = filename + '/' + subFilename,
                        subStat = fs.statSync(subFullname);
                    return {
                        name: subFilename,
                        fullname: subFullname,
                        suffix: subFilename.split('.').slice(1).join('.'),
                        mtime: subStat.mtime.getTime(),
                        isDirectory: subStat.isDirectory()
                    };
                });
            }
            var blockName = parentElementName || elementName,
                block = this.blocks[blockName] || (this.blocks[blockName] = {
                    name: blockName,
                    files: [],
                    dirs: [],
                    elements: {},
                    mods: {}
                });
            var destElement;
            if (parentElementName) {
                destElement = block.elements[elementName] || (block.elements[elementName] = {
                    name: elementName,
                    files: [],
                    dirs: [],
                    mods: {}
                });
            } else {
                destElement = block;
            }
            var collectionKey = fileInfo.isDirectory ? 'dirs' : 'files';
            if (modName) {
                if (!modVal) {
                    if (rl !== baseNameWithoutExt.length) {
                        modVal = baseNameWithoutExt.substr(rl + 1);
                    }
                }
                if (modName === 'view' && modVal === 'view') {
                    modVal = '';
                }
                var mod = destElement.mods[modName] || (destElement.mods[modName] = {}),
                    modValueFiles = (mod[modVal] || (mod[modVal] = {files: [], dirs: []}))[collectionKey];
                modValueFiles.push(fileInfo);
            } else {
                destElement[collectionKey].push(fileInfo);
            }
        }
    },

    /**
     * Загружает файлы и директории в папке модификатора.
     * @param {String} parentElementName
     * @param {String} elementName
     * @param {String} modName
     * @param {String} modDirPath
     * @private
     */
    _loadMod: function(parentElementName, elementName, modName, modDirPath) {
        var _this = this;
        filterFiles(fs.readdirSync(modDirPath)).forEach(function(filename) {
            var fullname = modDirPath + '/' + filename,
                stat = fs.statSync(fullname);
            _this._processFile(fullname, stat, parentElementName, elementName, modName);
        });
    },

    /**
     * Загружает файлы и директории в папке элемента или блока (если не указан parentElementName).
     * @param {String} parentElementName
     * @param {String} elementName
     * @param {String} elementDirPath
     * @param {String} containsElements
     * @private
     */
    _loadElement: function(parentElementName, elementName, elementDirPath, containsElements) {
        var _this = this;
        var requiredBaseNameWithoutExt = (parentElementName ? parentElementName + '__' : '') + elementName;
        filterFiles(fs.readdirSync(elementDirPath)).forEach(function(filename) {
            var fullname = elementDirPath + '/' + filename,
                stat = fs.statSync(fullname);
            if (stat.isDirectory()) {
                if (containsElements && filename.substr(0, 2) === '__') {
                    _this._loadElement(elementName, filename.substr(2), fullname, false);
                } else if (filename.charAt(0) === '_') {
                    _this._loadMod(parentElementName, elementName, filename.substr(1), fullname);
                } else if (filename.indexOf('.') !== -1 && filename.indexOf(requiredBaseNameWithoutExt + '.') === 0) {
                    _this._processFile(fullname, stat, parentElementName, elementName);
                } else if (containsElements) {
                    _this._loadElement(elementName, filename, fullname, false);
                }
            } else if (stat.isFile()) {
                _this._processFile(fullname, stat, parentElementName, elementName);
            }
        });
    },

    /**
     * Загружает уровень перепределения: загружает структуру блоков, элементов и модификаторов.
     */
    load: function() {
        if (this._loadPromise) {
            return this._loadPromise;
        }
        this._loadPromise = Vow.promise();

        var _this = this;
        if (this._schemeBuilder) {
            var levelBuilder = new LevelBuilder();
            Vow.when(this._schemeBuilder.buildLevel(this._path, levelBuilder)).then(function() {
                _this.blocks = levelBuilder.getBlocks();
                _this._loadPromise.fulfill(_this);
            });
        } else {
            var path = this._path;
            filterFiles(fs.readdirSync(path)).forEach(function(blockDir) {
                var blockDirPath = path + '/' + blockDir;
                if (fs.statSync(blockDirPath).isDirectory()) {
                    _this._loadElement(null, blockDir, blockDirPath, true);
                }
            });
            this._loadPromise.fulfill(this);
        }

        return this._loadPromise;
    }
});

function filterFiles(filenames) {
    return filenames.filter(function(filename) {
        return filename.charAt(0) !== '.';
    });
}
