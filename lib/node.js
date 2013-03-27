var Vow = require('vow'),
    fs = require('fs'),
    vowFs = require('vow-fs'),
    colors = require('colors'),
    path = require('path'),
    inherit = require('inherit'),
    TargetNotFoundEror = require('./errors/target-not-found-error');

module.exports = inherit({
    __constructor: function(nodePath, makePlatform, cache) {
        var root = makePlatform.getDir();
        this._makePlatform = makePlatform;
        this._path = nodePath;
        this._root = root;
        this._dirname = root + '/' + nodePath;
        this._targetName = path.basename(nodePath);
        this._techs = [];
        this._cache = cache;
        this._nodeCache = cache.subCache(nodePath);
        this._logger = null;
        this._targetNames = {};
        this._cache = {};
        this._env = null;
        this._targetNamesToBuild = [];
        this._targetNamesToClean = [];
        this._languages = null;
        this._registerTargetsPromise = null;
    },

    setBuildState: function(buildState) {
        this.buildState = buildState;
    },

    setLogger: function(logger) {
        this._logger = logger;
    },

    setLanguages: function(languages) {
        this._languages = languages;
    },
    
    getLanguages: function() {
        return this._languages;
    },

    getLogger: function() {
        return this._logger;
    },

    getDir: function() {
        return this._dirname;
    },

    getRootDir: function() {
        return this._root;
    },

    getPath: function() {
        return this._path;
    },

    setEnv: function(env) {
        this._env = env;
    },

    getEnv: function() {
        return this._env;
    },

    getTechs: function() {
        return this._techs;
    },

    setTechs: function(techs) {
        this._techs = techs;
    },

    setTargetsToBuild: function(targetsToBuild) {
        this._targetNamesToBuild = targetsToBuild;
    },

    setTargetsToClean: function(targetsToClean) {
        this._targetNamesToClean = targetsToClean;
    },

    resolvePath: function(filename) {
        return this._dirname + '/' + filename;
    },

    resolveNodePath: function(nodePath, filename) {
        return this._root + '/' + nodePath + '/' + filename;
    },

    unmaskNodeTargetName: function(nodePath, targetName) {
        return targetName.replace(/\?/g, path.basename(nodePath));
    },

    relativePath: function(filename) {
        return path.relative(this._path, filename);
    },

    wwwRootPath: function(filename, wwwRoot) {
        wwwRoot = wwwRoot || '/';
        return wwwRoot + path.relative(this._root, filename);
    },

    cleanTargetFile: function(target) {
        var targetPath = this.resolvePath(target);
        if (fs.existsSync(targetPath)) {
            fs.unlinkSync(this.resolvePath(target));
            this.getLogger().logClean(target);
        }
    },

    createTmpFileForTarget: function(targetName) {
        var dir = this._dirname;
        function createTmpFilename() {
            var prefix = '_tmp_' + (+new Date()) + (Math.random() * 0x1000000000).toString(36) + '_',
                filename = dir + '/' + prefix + targetName;
            return vowFs.exists(filename).then(function(exists) {
                if (exists) {
                    return createTmpFilename();
                } else {
                    return vowFs.write(filename, '').then(function() {
                        return filename;
                    });
                }
            });
        }
        return createTmpFilename();
    },

    loadTechs: function() {
        var _this = this;
        return Vow.all(this._techs.map(function(t) {
            return t.init(_this);
        }));
    },

    _getTarget: function(name) {
        var targets = this._targetNames, target;
        if (!(target = targets[name])) {
            target = targets[name] = {started: false};
        }
        if (!target.promise) {
            target.promise = Vow.promise();
        }
        return target;
    },

    hasRegisteredTarget: function(name) {
        return !!this._targetNames[name];
    },

    getTargetName: function(suffix) {
        return this._targetName + (suffix ? '.' + suffix : '');
    },

    unmaskTargetName: function(targetName) {
        return targetName.replace(/\?/g, this._targetName);
    },

    _registerTarget: function(target, tech) {
        var targetObj = this._getTarget(target);
        if (targetObj.tech) {
            throw Error(
                'Concurrent techs for target: ' + target + ', techs: "' + targetObj.tech.getName() + '" vs "' + tech.getName() + '"'
            );
        }
        targetObj.tech = tech;
    },

    resolveTarget: function(target, value) {
        var targetObj = this._getTarget(target);
        this._logger.logAction('resolved', target
            + colors.grey(' ~' + targetObj.tech.getName())
        );
        return targetObj.promise.fulfill(value);
    },

    rejectTarget: function(target, err) {
        this._logger.logErrorAction('failed', target);
        return this._getTarget(target).promise.reject(err);
    },

    requireNodeSources: function(sourcesByNodes) {
        var _this = this,
            resultByNodes = {};
        return Vow.all(Object.keys(sourcesByNodes).map(function(nodePath) {
            return _this._makePlatform.requireNodeSources(nodePath, sourcesByNodes[nodePath]).then(function(results) {
                resultByNodes[nodePath] = results;
            });
        })).then(function() {
            return resultByNodes;
        });
    },

    requireSources: function(sources) {
        var _this = this;
        return this._registerTargets().then(function() {
            return Vow.all(sources.map(function(source) {
                source = _this.unmaskTargetName(source);
                var targetObj = _this._getTarget(source);
                if (!targetObj.tech) {
                    throw TargetNotFoundEror('There is no tech for target ' + _this._path + '/' + source + '.');
                }
                if (!targetObj.started) {
                    targetObj.started = true;
                    if (!targetObj.tech.__started) {
                        targetObj.tech.__started = true;
                        try {
                            Vow.when(targetObj.tech.build()).fail(function(err) {
                                _this.rejectTarget(source, err);
                            });
                        } catch (err) {
                            _this.rejectTarget(source, err);
                        }
                    }
                }
                return targetObj.promise;
            }));
        });
    },

    cleanTargets: function(targets) {
        var _this = this;
        return Vow.all(targets.map(function(target) {
            var targetObj = _this._getTarget(target);
            if (!targetObj.tech) {
                throw Error('There is no tech for target ' + target + '.');
            }
            return Vow.when(targetObj.tech.clean());
        }));
    },

    _registerTargets: function() {
        var _this = this;
        if (!this._registerTargetsPromise) {
            this._registerTargetsPromise = Vow.all(this._techs.map(function (t) {
                    return t.getTargets();
                })).then(function (targetLists) {
                    for (var i = 0, l = _this._techs.length; i < l; i++) {
                        targetLists[i].forEach(function (targetName) {
                            _this._registerTarget(targetName, _this._techs[i]);
                        });
                    }
                });
        }
        return this._registerTargetsPromise;
    },

    _resolveTargets: function(targets, defaultTargetList) {
        var targetsToBuild = this._targetNamesToBuild, _this = this;
        if (targets) {
            targetsToBuild = targets;
            targetsToBuild = [].concat.apply([], targetsToBuild.map(function(targetName) {
                if (targetName == '*') {
                    return (defaultTargetList.length ? defaultTargetList : Object.keys(_this._targetNames));
                } else {
                    return [targetName];
                }
            }));
        }
        if (!targetsToBuild) {
            targetsToBuild = Object.keys(this._targetNames);
        }
        targetsToBuild = targetsToBuild.filter(function(elem, pos) {
            return targetsToBuild.indexOf(elem) == pos;
        });
        return targetsToBuild;
    },

    build: function(targets) {
        var _this = this;
        return this.requireSources(_this._resolveTargets(targets, _this._targetNamesToBuild));
    },

    clean: function(targets, buildCache) {
        var _this = this;
        this.buildState = buildCache || {};
        return this._registerTargets().then(function(){
            return _this.cleanTargets(_this._resolveTargets(targets, _this._targetNamesToClean));
        });
    },

    getNodeCache: function(subCache) {
        return subCache ? this._nodeCache.subCache(subCache) : this._nodeCache;
    }
});
