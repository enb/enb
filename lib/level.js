(function() {
  var Level, Vow, fs;

  Vow = require('vow');

  fs = require('fs');

  Level = (function() {
    var fileNode, getSuffix;

    getSuffix = function(filename) {
      return filename.split('.').slice(1).join('.');
    };

    fileNode = function(fullname, filename, stats) {
      return {
        name: filename,
        fullname: fullname,
        suffix: getSuffix(filename),
        mtime: +stats.mtime
      };
    };

    function Level(path) {
      this.path = path;
      this.blocks = {};
      this.promise = null;
      this._loaded = false;
    }

    Level.prototype.setLoaded = function() {
      this.promise = Vow.fulfill();
    };

    Level.prototype.getBlocks = function() {
      return this.blocks;
    };

    Level.prototype.setBlocks = function(blocks) {
      this.blocks = blocks;
    };

    Level.prototype.hasBlock = function(blockName) {
      return this.blocks[blockName];
    };

    Level.prototype.load = function() {
      this._loadStarted = true;
      var loadBlock, loadElement, loadModifier, promise,
        _this = this;
      if (this.promise) {
        return this.promise;
      }
      loadModifier = function(modifierPath, modifierName, elementName) {
        var modPre, modPreL, modifier, modifierPromise,
          _this = this;
        modifierPromise = Vow.promise();
        modifier = {};
        modPre = elementName + '_' + modifierName;
        modPreL = modPre.length;
        fs.readdir(modifierPath, function(err, files) {
          if (err) {
            return modifierPromise.reject(err);
          }
          return Vow.all(files.map(function(filename) {
            var filePromise, fullname;
            filePromise = Vow.promise();
            fullname = modifierPath + '/' + filename;
            fs.stat(fullname, function(err, stats) {
              var baseName, modStr, modVal;
              if (err) {
                return filePromise.reject(err);
              }
              if (stats.isFile()) {
                baseName = filename.split('.')[0];
                if (baseName.indexOf(modPre) === 0) {
                  modStr = baseName.substr(modPreL);
                  if (modStr.charAt(0) === '_') {
                    modStr = modStr.substr(1);
                  }
                  modVal = modifier[modStr] || (modifier[modStr] = []);
                  if (baseName === modPre + (modStr ? '_' + modStr : '')) {
                    modVal.push(fileNode(fullname, filename, stats));
                  }
                }
              }
              return filePromise.fulfill();
            });
            return filePromise;
          })).then((function() {
            return modifierPromise.fulfill([modifierName, modifier]);
          }), function(err) {
            return modifierPromise.reject(err);
          });
        });
        return modifierPromise;
      };
      loadElement = function(elementName, elementDirPath, containsElements, blockName) {
        var element, elementFullName, elementPromise,
          _this = this;
        elementFullName = (blockName ? blockName + '__' : '') + elementName;
        element = {
          name: elementName,
          files: [],
          mods: {}
        };
        if (containsElements) {
          element.elements = {};
        }
        elementPromise = Vow.promise();
        fs.readdir(elementDirPath, function(err, files) {
          if (err) {
            return elementPromise.reject(err);
          }
          return Vow.all(files.map(function(filename) {
            var filePromise, fullname;
            filePromise = Vow.promise();
            fullname = elementDirPath + '/' + filename;
            fs.stat(fullname, function(err, stats) {
              var baseName;
              if (err) {
                return filePromise.reject(err);
              }
              if (stats.isFile()) {
                baseName = filename.split('.')[0];
                if (baseName === elementFullName) {
                  element.files.push(fileNode(fullname, filename, stats));
                }
                return filePromise.fulfill();
              } else if (stats.isDirectory()) {
                if (filename.charAt(0) === '.') {
                  return filePromise.fulfill();
                } else if (containsElements && filename.indexOf('__') === 0) {
                  return loadElement(filename.substr(2), fullname, false, elementName).then((function(elementInfo) {
                    element.elements[elementInfo[0]] = elementInfo[1];
                    return filePromise.fulfill();
                  }), (function(err) {
                    return filePromise.reject(err);
                  }));
                } else if (containsElements && filename.charAt(0) !== '_') {
                  return loadElement(filename, fullname, false, elementName).then((function(elementInfo) {
                    element.elements[elementInfo[0]] = elementInfo[1];
                    return filePromise.fulfill();
                  }), (function(err) {
                    return filePromise.reject(err);
                  }));
                } else if (filename.indexOf('_') === 0) {
                  return loadModifier(fullname, filename.substr(1), elementFullName).then((function(modData) {
                    element.mods[modData[0]] = modData[1];
                    return filePromise.fulfill();
                  }), function(err) {
                    return filePromise.reject(err);
                  });
                } else {
                  return filePromise.fulfill();
                }
              } else {
                return filePromise.fulfill();
              }
            });
            return filePromise;
          })).then((function() {
            return elementPromise.fulfill([elementName, element]);
          }), function(err) {
            return elementPromise.reject(err);
          });
        });
        return elementPromise;
      };
      loadBlock = function(blockName) {
        var blockPromise, fullname;
        blockPromise = Vow.promise();
        fullname = _this.path + '/' + blockName;
        fs.stat(fullname, function(err, stats) {
          if (err) {
            blockPromise.reject(err);
          }
          if (stats.isDirectory()) {
            return loadElement(blockName, fullname, true).then((function(data) {
              return blockPromise.fulfill(data);
            }), function(err) {
              return blockPromise.reject(err);
            });
          } else {
            return blockPromise.fulfill(null);
          }
        });
        return blockPromise;
      };
      promise = Vow.promise();
      fs.readdir(this.path, function(err, dirs) {
        if (err) {
          return promise.reject(err);
        }
        dirs = dirs.filter(function(d) {
          return d.charAt(0) !== '.';
        });
        return Vow.all(dirs.map(loadBlock)).spread((function() {
          var blockInfo, _i, _len;
          for (_i = 0, _len = arguments.length; _i < _len; _i++) {
            blockInfo = arguments[_i];
            if (blockInfo) {
              _this.blocks[blockInfo[0]] = blockInfo[1];
            }
          }
          return promise.fulfill();
        }), function(err) {
          return promise.reject(err);
        });
      });
      this.promise = promise;
      return promise;
    };

    return Level;

  })();

  module.exports = Level;

}).call(this);
