var Vow = require('vow'),
    fs = require('fs'),
    colors = require('colors');

function Node(path, dirname, target, techs, tmpDir) {
    this.path = path;
    this._dirname = dirname;
    this.target = target;
    this.techs = techs;
    this.tmpDir = tmpDir;
    this.logger = null;
    this._targets = {};
    this._cache = {};
    this._env = null;
    this._targetsToBuild = null;
}

Node.prototype = {
    setLogger: function(logger) {
        this.logger = logger;
    },

    getDir: function() {
        return this._dirname;
    },

    setEnv: function(env) {
        this._env = env;
    },

    getEnv: function() {
        return this._env;
    },

    setTargetsToBuild: function(targetsToBuild) {
        this._targetsToBuild = targetsToBuild;
    },

    resolvePath: function(filename) {
        return this._dirname + '/' + filename;
    },

    loadTechs: function() {
        var _this = this;
        return Vow.all(this.techs.map(function(t) {
            return t.init(_this);
        }).filter(function(t) {
            return Vow.isPromise(t);
        }));
    },

    _getTarget: function(name) {
        var targets = this._targets, target;
        if (!(target = targets[name])) {
            target = targets[name] = {started: false};
        }
        if (!target.promise) {
            target.promise = Vow.promise();
        }
        return target;
    },

    getTargetName: function(suffix) {
        return this.target + (suffix ? '.' + suffix : '');
    },

    _registerTarget: function(target, tech) {
        var targetObj = this._getTarget(target);
        targetObj.tech = tech;
    },

    resolveTarget: function(target, value) {
        var targetObj = this._getTarget(target);
        this.logger.logAction('resolved', target
            + (targetObj.startTime ? ' - ' + colors.red((new Date() - targetObj.startTime) + 'ms') : ''));
        return targetObj.promise.fulfill(value);
    },

    rejectTarget: function(target, err) {
        return this._getTarget(target).promise.reject(err);
    },

    requireSources: function(sources) {
        var promises = [];
        for (var i = 0, l = sources.length; i < l; i++) {
            var targetObj = this._getTarget(sources[i]);
            if (!targetObj.tech) {
                throw Error('There is no tech for target ' + sources[i] + '.');
            }
            if (!targetObj.started) {
                targetObj.started = true;
                targetObj.startTime = new Date();
                targetObj.tech.build();
            }
            promises.push(targetObj.promise);
        }
        return Vow.all(promises);
    },

    build: function(target, buildCache) {
        var _this = this;
        this.buildCache = buildCache || {};

        return Vow.all(this.techs.map(function (t) {
                return t.getTargets();
            })).then(function (targetLists) {
                for (var i = 0, l = _this.techs.length; i < l; i++) {
                    targetLists[i].forEach(function (targetName) {
                        _this._registerTarget(targetName, _this.techs[i]);
                    });
                }
                var targetsToBuild = _this._targetsToBuild;
                if (target) {
                    targetsToBuild = [target];
                }
                if (!targetsToBuild) {
                    targetsToBuild = Object.keys(_this._targets);
                }
                return _this.requireSources(targetsToBuild);
            });
    },

    getCache: function(cacheName, cacheClass) {
        var cacheFilename;
        if (!this._cache[cacheName]) {
            cacheFilename = this.tmpDir + '/cache/' + this.target + '_' + cacheName + '.cache.js';
            this._cache[cacheName] = new cacheClass(cacheFilename);
            if (fs.existsSync(cacheFilename)) {
                this._cache[cacheName].load();
            }
        }
        return this._cache[cacheName];
    }
};

module.exports = Node;
