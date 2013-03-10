var Vow = require('vow'),
    fs = require('fs'),
    colors = require('colors'),
    path = require('path'),
    inherit = require('inherit');

module.exports = inherit({
    __constructor: function(nodePath, dirname, cache) {
        this._path = nodePath;
        this._dirname = dirname;
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

    relativePath: function(filename) {
        return path.relative(this._path, filename);
    },

    cleanTargetFile: function(target) {
        var targetPath = this.resolvePath(target);
        if (fs.existsSync(targetPath)) {
            fs.unlinkSync(this.resolvePath(target));
            this.getLogger().logClean(target);
        }
    },

    loadTechs: function() {
        var _this = this;
        return Vow.all(this._techs.map(function(t) {
            return t.init(_this);
        }).filter(function(t) {
            return Vow.isPromise(t);
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

    getTargetName: function(suffix) {
        return this._targetName + (suffix ? '.' + suffix : '');
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

    requireSources: function(sources) {
        var _this = this;
        return Vow.all(sources.map(function(source) {
            var targetObj = _this._getTarget(source);
            if (!targetObj.tech) {
                throw Error('There is no tech for target ' + source + '.');
            }
            if (!targetObj.started) {
                targetObj.started = true;
                if (!targetObj.tech.__started) {
                    targetObj.tech.__started = true;
                    try {
                        Vow.when(targetObj.tech.build()).then(null, function(err) {
                            _this.rejectTarget(source, err);
                        });
                    } catch (err) {
                        _this.rejectTarget(source, err);
                    }
                }
            }
            return targetObj.promise;
        }));
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
        if (this._targetsRegistered) {
            return Vow.fulfill();
        } else {
            return Vow.all(this._techs.map(function (t) {
                    return t.getTargets();
                })).then(function (targetLists) {
                    for (var i = 0, l = _this._techs.length; i < l; i++) {
                        targetLists[i].forEach(function (targetName) {
                            _this._registerTarget(targetName, _this._techs[i]);
                        });
                    }
                    _this._targetsRegistered = true;
                });
        }   
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

    build: function(targets, buildCache) {
        var _this = this;
        this.buildCache = buildCache || {};
        return this._registerTargets().then(function(){
            return _this.requireSources(_this._resolveTargets(targets, _this._targetNamesToBuild));
        });
    },

    clean: function(targets, buildCache) {
        var _this = this;
        this.buildCache = buildCache || {};
        return this._registerTargets().then(function(){
            return _this.cleanTargets(_this._resolveTargets(targets, _this._targetNamesToBuild.concat(_this._targetNamesToClean)));
        });
    },

    getNodeCache: function(subCache) {
        return subCache ? this._nodeCache.subCache(subCache) : this._nodeCache;
    }
});
