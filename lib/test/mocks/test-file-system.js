var fs = require('fs');
var inherit = require('inherit');
var vow = require('vow');
var path = require('path');
var asyncFs = require('../../fs/async-fs');
var deprecate = require('../../utils/deprecate');

deprecate({module: 'test-file-system', rmSince: 'v1.0.0', replaceModule: 'mock-fs'});

/**
 * @name TestFileSystem
 * @deprecated
 */
module.exports = inherit({
    __constructor: function (fileSystemStructure, root) {
        this._structure = fileSystemStructure;
        this._root = root || process.cwd();
        this._originalFsFunctions = null;
        this._originalAsyncFsFunctions = null;
    },
    setup: function () {
        var mocks = createMocks(this._structure, this._root);

        this._originalAsyncFsFunctions = {};
        for (var asyncFsMethodName in asyncFs) {
            this._originalAsyncFsFunctions[asyncFsMethodName] = asyncFs[asyncFsMethodName];
            // Заменяем пустой функцией для безопасности.
            asyncFs[asyncFsMethodName] = createEmptyFunction(asyncFsMethodName);
        }
        for (var asyncFsMockName in mocks.vowFs) {
            asyncFs[asyncFsMockName] = mocks.vowFs[asyncFsMockName];
        }

        this._originalFsFunctions = {};
        for (var fsMethodName in fs) {
            this._originalFsFunctions[fsMethodName] = fs[fsMethodName];
            // Заменяем пустой функцией для безопасности.
            fs[fsMethodName] = createEmptyFunction(fsMethodName);
        }
        for (var fsMockName in mocks.fs) {
            fs[fsMockName] = mocks.fs[fsMockName];
        }
    },
    teardown: function () {
        for (var asyncFsMethodName in this._originalAsyncFsFunctions) {
            asyncFs[asyncFsMethodName] = this._originalAsyncFsFunctions[asyncFsMethodName];
        }
        for (var fsMethodName in this._originalFsFunctions) {
            fs[fsMethodName] = this._originalFsFunctions[fsMethodName];
        }
    }
});

function createEmptyFunction(methodName) {
    return function () {
        throw new Error('Mock `' + methodName + '` is not implemented.');
    };
}

function createMocks (structure, root) {
    var timeObj = new Date();
    function isAbsolutePath(filePath) {
        return filePath === path.resolve(filePath);
    }
    function getRelativePath(filePath) {
        if (isAbsolutePath(filePath)) {
            if (filePath.indexOf(root + path.sep) === 0) {
                return filePath.replace(root + path.sep, '');
            } else {
                return null;
            }
        } else {
            return filePath;
        }
    }
    function getNodeName(node) {
        if (node.directory) {
            return node.directory;
        } else {
            return node.file;
        }
    }
    function getNode(filePath) {
        filePath = getRelativePath(filePath);
        var pathBits = filePath.split(path.sep);
        var nodeItems = structure;
        var currentPathBit;
        var foundNode;
        while (Boolean(currentPathBit = pathBits.shift())) {
            if (!nodeItems) {
                return null;
            }
            foundNode = null;
            for (var i = 0; i < nodeItems.length; i++) {
                var subNode = nodeItems[i];
                if (getNodeName(subNode) === currentPathBit) {
                    foundNode = subNode;
                }
            }
            if (!foundNode) {
                return null;
            }
            nodeItems = foundNode.items;
        }
        return foundNode;
    }
    function isFile(node) {
        return !!node.file;
    }
    function isDirectory(node) {
        return !!node.directory;
    }
    function isSocket() {
        return false;
    }
    function isSymLink() {
        return false;
    }
    function createFileNotFoundError(filename) {
        return new Error('File not found: ' + filename + ' (' + getRelativePath(filename) + ')');
    }
    function createIsDirectoryError(filename) {
        return new Error('Path is a directory: ' + filename);
    }
    function createIsFileError(filename) {
        return new Error('Path is a file: ' + filename);
    }
    function createFileNode(name, content) {
        return {file: name, content: content};
    }
    function createDirectoryNode(name) {
        return {directory: name, items: []};
    }
    function createStats(node) {
        return {
            uid: 0,
            gid: 0,
            isFile: function () {
                return isFile(node);
            },
            isDirectory: function () {
                return isDirectory(node);
            },
            isSymbolicLink: function () {
                return isSymLink(node);
            },
            isSocket: function () {
                return isSocket(node);
            },
            size: node.content ? node.content.length : 0,
            atime: timeObj,
            mtime: timeObj,
            ctime: timeObj
        };
    }
    return {
        vowFs: {
            read: function (filename) {
                try {
                    return vow.fulfill(this._readSync(filename));
                } catch (e) {
                    return vow.reject(e);
                }
            },

            _readSync: function (filename) {
                var node = getNode(filename);
                if (node) {
                    if (isFile(node)) {
                        return node.content;
                    } else {
                        throw createIsDirectoryError(filename);
                    }
                } else {
                    throw createFileNotFoundError(filename);
                }
            },

            write: function (filename, content) {
                var node = getNode(filename);
                if (node) {
                    if (isFile(node)) {
                        node.content = content;
                        return vow.resolve();
                    } else {
                        return vow.reject(createIsDirectoryError(filename));
                    }
                } else {
                    var parentNode = getNode(path.dirname(filename));
                    if (parentNode) {
                        if (isDirectory(parentNode)) {
                            parentNode.items.push(createFileNode(path.basename(filename), content));
                            return vow.resolve();
                        } else {
                            return vow.reject(createIsFileError(filename));
                        }
                    } else {
                        return vow.reject(createFileNotFoundError(filename));
                    }
                }
            },

            append: function (filename, data) {
                return this.read(filename, function (content) {
                    return this.write(filename, content + data);
                }.bind(this));
            },

            remove: function (filename) {
                var node = getNode(filename);
                if (node) {
                    if (isFile(node)) {
                        var parentNode = getNode(path.basename(filename));
                        parentNode.items.splice(parentNode.items.indexOf(node), 1);
                        return vow.fulfill();
                    } else {
                        return vow.reject(createIsDirectoryError(filename));
                    }
                } else {
                    return vow.reject(createFileNotFoundError(filename));
                }
            },

            removeDir: function (dirPath) {
                var node = getNode(dirPath);
                if (node) {
                    if (isDirectory(node)) {
                        var parentNode = getNode(path.basename(dirPath));
                        parentNode.items.splice(parentNode.items.indexOf(node), 1);
                        return vow.fulfill();
                    } else {
                        return vow.reject(createIsFileError(dirPath));
                    }
                } else {
                    return vow.reject(createFileNotFoundError(dirPath));
                }
            },

            move: function (source, dest) {
                return this.copy(source, dest).then(function () {
                    return this.isFile(source).then(function (isFile) {
                        return isFile ? this.remove(source) : this.removeDir(source);
                    }.bind(this));
                }.bind(this));
            },

            copy: function (source, dest) {
                var node = getNode(source);
                var destNode = getNode(dest);
                if (destNode) {
                    var destParentNode = getNode(path.basename(dest));
                    destParentNode.items.splice(destParentNode.items.indexOf(destNode), 1);
                }
                if (node) {
                    if (isFile(node)) {
                        return this.read(source).then(function (data) {
                            return this.write(dest, data);
                        }.bind(this));
                    } else {
                        return this.makeDir(dest).then(function () {
                            return this.listDir(source).then(function (filenames) {
                                return vow.all(filenames.map(function (filename) {
                                    return this.copy(path.join(source, filename), path.join(dest, filename));
                                }, this));
                            }.bind(this));
                        }.bind(this));
                    }
                } else {
                    throw createFileNotFoundError(source);
                }
            },

            listDir: function (dirPath) {
                var node = getNode(dirPath);
                if (node) {
                    if (isDirectory(node)) {
                        return vow.fulfill(node.items.map(function (subNode) {
                            return getNodeName(subNode);
                        }));
                    } else {
                        return vow.reject(createIsFileError(dirPath));
                    }
                } else {
                    return vow.reject(createFileNotFoundError(dirPath));
                }
            },

            makeDir: function (dirPath) {
                var node = getNode(dirPath);
                if (node) {
                    if (isFile(node)) {
                        return vow.reject(createIsFileError(dirPath));
                    } else {
                        return vow.fulfill();
                    }
                } else {
                    var parentDirPath = path.basename(dirPath);
                    return this.makeDir(parentDirPath).then(function () {
                        var parentNode = getNode(parentDirPath);
                        var childNode = getNode(dirPath);
                        if (childNode && parentNode.items.indexOf(childNode) !== -1) {
                            if (isDirectory(childNode)) {
                                return vow.fulfill();
                            } else {
                                return vow.reject(createIsFileError(dirPath));
                            }
                        } else {
                            parentNode.items.push(createDirectoryNode(path.basename(dirPath)));
                            return vow.fulfill();
                        }
                    });
                }
            },

            isFile: function (filename) {
                var node = getNode(filename);
                if (node) {
                    return vow.fulfill(isFile(node));
                } else {
                    return vow.reject(createFileNotFoundError(filename));
                }
            },

            isDir: function (filename) {
                var node = getNode(filename);
                if (node) {
                    return vow.fulfill(isDirectory(node));
                } else {
                    return vow.reject(createFileNotFoundError(filename));
                }
            },

            isSocket: function (filename) {
                var node = getNode(filename);
                if (node) {
                    return vow.fulfill(isSocket(node));
                } else {
                    return vow.reject(createFileNotFoundError(filename));
                }
            },

            isSymLink: function (filename) {
                var node = getNode(filename);
                if (node) {
                    return vow.fulfill(isSymLink(node));
                } else {
                    return vow.reject(createFileNotFoundError(filename));
                }
            },

            exists: function (filename) {
                return vow.fulfill(Boolean(getNode(filename)));
            },

            absolute: function (filename) {
                return vow.fulfill(path.resolve(root, filename));
            },

            chown: function () {
                return vow.fulfill(); // не поддерживаем права
            },

            chmod: function () {
                return vow.fulfill(); // не поддерживаем права
            },

            stats: function (filename) {
                var node = getNode(filename);
                if (node) {
                    return vow.fulfill(createStats(node));
                } else {
                    return vow.reject(createFileNotFoundError(filename));
                }
            },

            link: function () {
                return vow.fulfill(); // не поддерживаем ссылки
            },

            symLink: function () {
                return vow.fulfill(); // не поддерживаем ссылки
            }
        },
        fs: {
            existsSync: function (filename) {
                return Boolean(getNode(filename));
            },

            statSync: function (filename) {
                var node = getNode(filename);
                if (node) {
                    return createStats(node);
                } else {
                    throw createFileNotFoundError(filename);
                }
            },

            readdir: function (dirPath, callback) {
                var node = getNode(dirPath);
                if (!node) {
                    return callback(createFileNotFoundError(dirPath));
                }
                if (!isDirectory(node)) {
                    return callback(createIsFileError(dirPath));
                }
                callback(undefined, node.items.map(function (subNode) {
                    return getNodeName(subNode);
                }));
            },

            readdirSync: function (dirPath) {
                var node = getNode(dirPath);
                if (node) {
                    if (isDirectory(node)) {
                        return node.items.map(function (subNode) {
                            return getNodeName(subNode);
                        });
                    } else {
                        throw createIsFileError(dirPath);
                    }
                } else {
                    throw createFileNotFoundError(dirPath);
                }
            },

            realpathSync: function (destPath) {
                return path.resolve(process.cwd(), destPath);
            },

            readFileSync: function (filename) {
                var node = getNode(filename);
                if (node) {
                    if (isFile(node)) {
                        return node.content;
                    } else {
                        throw createIsDirectoryError(filename);
                    }
                } else {
                    throw createFileNotFoundError(filename);
                }
            }
        }
    };
}
