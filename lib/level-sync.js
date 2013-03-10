var inherit = require('inherit'),
    fs = require('fs');

// TODO: Сделать 1-в-1 асинхронный аналог (с точно таким же порядком файлов на выходе).
module.exports = inherit({
    __constructor: function(path) {
        this._path = path;
        this.blocks = {};
        this._loaded = false;
    },
    setLoaded: function() {
        this._loaded = true;
    },
    getBlocks: function() {
        return this.blocks;
    },
    setBlocks: function(blocks) {
        this.blocks = blocks;
    },
    hasBlock: function(blockName) {
        return this.blocks[blockName];
    },
    getPath: function() {
        return this._path;
    },
    _processFile: function(filename, stat, parentElementName, elementName, modName) {
        var requiredBaseNameWithoutExt = (parentElementName ? parentElementName + '__' : '')
                + elementName + (modName ? '_' + modName : ''),
            baseName = filename.split('/').slice(-1)[0],
            baseNameParts = baseName.split('.'),
            baseNameWithoutExt = baseNameParts[0],
            rl = requiredBaseNameWithoutExt.length;
        if (baseNameWithoutExt.indexOf(requiredBaseNameWithoutExt) == 0 && (
                modName
                    ? (rl == baseNameWithoutExt.length)
                        || baseNameWithoutExt.charAt(rl) == '_'
                    : true
            )) {
            var suffix = baseNameParts.slice(1).join('.'),
                fileInfo = {
                    name: baseName,
                    fullname: filename,
                    suffix: suffix,
                    mtime: +stat.mtime,
                    isDirectory: stat.isDirectory()
                };
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
                var modVal = '';
                if (rl != baseNameWithoutExt.length) {
                    modVal = baseNameWithoutExt.substr(rl + 1);
                }
                var mod = destElement.mods[modName] || (destElement.mods[modName] = {}),
                    modValueFiles = (mod[modVal] || (mod[modVal] = {files:[], dirs: []}))[collectionKey];
                modValueFiles.push(fileInfo);
            } else {
                destElement[collectionKey].push(fileInfo);
            }
        }
    },

    _loadMod: function(parentElementName, elementName, modName, modDirPath) {
        var _this = this;
        filterFiles(fs.readdirSync(modDirPath)).forEach(function(filename) {
            var fullname = modDirPath + '/' + filename,
                stat = fs.statSync(fullname);
            _this._processFile(fullname, stat, parentElementName, elementName, modName);
        });
    },

    _loadElement: function(parentElementName, elementName, elementDirPath, containsElements) {
        var elementFullName = (parentElementName ? parentElementName + '__' : '') + elementName,
            _this = this;
        filterFiles(fs.readdirSync(elementDirPath)).forEach(function(filename) {
            var fullname = elementDirPath + '/' + filename,
                stat = fs.statSync(fullname);
            if (stat.isDirectory()) {
                if (containsElements && filename.substr(0, 2) === '__') {
                    _this._loadElement(elementName, filename.substr(2), fullname, false);
                } else if (filename.charAt(0) === '_') {
                    _this._loadMod(parentElementName, elementName, filename.substr(1), fullname);
                } else if (filename.indexOf('.') !== -1) {
                    _this._processFile(fullname, stat, parentElementName, elementName);
                } else if (containsElements) {
                    _this._loadElement(elementName, filename, fullname, false);
                }
            } else if (stat.isFile()) {
                _this._processFile(fullname, stat, parentElementName, elementName);
            }
        });
    },

    load: function() {
        if (this._loaded) {
            return;
        }
        var path = this._path, _this = this;
        filterFiles(fs.readdirSync(path)).forEach(function(blockDir) {
            var blockDirPath = path + '/' + blockDir;
            if (fs.statSync(blockDirPath).isDirectory()) {
                _this._loadElement(null, blockDir, blockDirPath, true);
            }
        });
    }
});

function filterFiles(filenames) {
    return filenames.filter(function(filename) {
        return filename.charAt(0) != '.';
    });
};