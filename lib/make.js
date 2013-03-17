var Vow = require('vow'),
    Node = require('./node'),
    path = require('path'),
    Logger = require('./logger'),
    colors = require('colors'),
    ProjectConfig = require('./config/project-config'),
    Cache = require('./cache/cache'),
    CacheStorage = require('./cache/cache-storage'),
    inherit = require('inherit'),
    vowFs = require('vow-fs'),
    fs = require('fs');

module.exports = inherit({
    __constructor: function() {
        this._nodes = {};
        this._nodeInitPromises = {};
        this._cacheStorage = null;
        this._cache = null;
        this._projectConfig = null;
        this._cdir = null;
        this._languages = null;
        this._env = {};
    },

    init: function(cdir) {
        var _this = this,
            projectName = path.basename(cdir),
            makefilePath = cdir + '/.bem/enb-make.js',
            personalMakefilePath = cdir + '/.bem/enb-make.personal.js';
        this._cdir = cdir;
        this._projectName = projectName;
        this._logger = new Logger(projectName);
        this._buildState = {};

        var projectConfig = this._projectConfig = new ProjectConfig(cdir);

        try {
            delete require.cache[makefilePath];
            require(makefilePath)(projectConfig);
        } catch (err) {
            return Vow.reject(err);
        }

        if (fs.existsSync(personalMakefilePath)) {
            delete require.cache[personalMakefilePath];
            require(personalMakefilePath)(projectConfig);
        }

        this._languages = projectConfig.getLanguages();
        this._env = projectConfig.getEnvValues();

        projectConfig.task('clean', function(task) {
            return task.cleanTargets([].slice.call(arguments, 1));
        });

        var tmpDir = cdir + '/.bem/tmp';

        return vowFs.makeDir(tmpDir).then(function() {
            _this._cacheStorage = new CacheStorage(tmpDir + '/cache.js');
            _this._nodes = {};
        });
    },

    getDir: function() {
        return this._cdir;
    },

    loadCache: function() {
        this._cacheStorage.load();
        var version = require('../package.json').version;
        // Invalidate cache is ENB package was updated.
        if (this._cacheStorage.get(':make', 'version') != version) {
            this._cacheStorage.drop();
            this._cacheStorage.set(':make', 'version', version);
        }
    },

    getEnv: function() {
        return this._env;
    },

    setEnv: function(env) {
        this._env = env;
    },

    saveCache: function() {
        this._cacheStorage.set(':make', 'version', require('../package.json').version);
        this._cacheStorage.save();
    },

    getCacheStorage: function() {
        return this._cacheStorage;
    },

    setCacheStorage: function(cacheStorage) {
        this._cacheStorage = cacheStorage;
    },

    getLanguages: function() {
        return this._languages;
    },

    setLanguages: function(languages) {
        this._languages = languages;
    },

    getLogger: function() {
        return this._logger;
    },

    setLogger: function(logger) {
        this._logger = logger;
    },

    initNode: function(nodePath) {
        if (!this._nodeInitPromises[nodePath]) {
            var _this = this,
                nodeConfig = this._projectConfig.getNodeConfig(nodePath),
                node = new Node(nodePath, this, this._cache);
            node.setLogger(this._logger.subLogger(nodePath));
            node.setEnv({});
            this._nodes[nodePath] = node;
            this._nodeInitPromises[nodePath] = Vow.when(nodeConfig.exec())
                .then(function() {
                    return Vow.all(_this._projectConfig.getNodeMaskConfigs(nodePath).map(function(nodeMaskConfig) {
                        return nodeMaskConfig.exec([], nodeConfig);
                    }));
                })
                .then(function() {
                    node.setLanguages(nodeConfig.getLanguages() || _this._languages);
                    node.setTargetsToBuild(nodeConfig.getTargets());
                    node.setTargetsToClean(nodeConfig.getCleanTargets());
                    node.setTechs(nodeConfig.getTechs());
                    node.setBuildState(_this._buildState);
                    return node.loadTechs();
                });
        }
        return this._nodeInitPromises[nodePath];
    },

    requireNodeSources: function(nodePath, sources) {
        var _this = this;
        return this.initNode(nodePath).then(function() {
            return _this._nodes[nodePath].requireSources(sources);
        });
    },

    dropCache: function() {
        this._cacheStorage.drop();
    },

    _getNodePathsLenDesc: function() {
        return Object.keys(this._projectConfig.getNodeConfigs()).sort(function(a, b) {
            return a.length - b.length;
        });
    },

    _resolveTarget: function(target, nodePaths) {
        for (var i = 0, l = nodePaths.length; i < l; i++) {
            var nodePath = nodePaths[i];
            if (target.indexOf(nodePath) == 0) {
                var npl = nodePath.length;
                if (target.length == npl) {
                    return {
                        node: nodePath,
                        targets: ['*']
                    };
                } else if (target.charAt(npl) == '/') {
                    return {
                        node: nodePath,
                        targets: [target.substr(npl + 1)]
                    };
                }
            }
        }
        throw Error('Target not found: ' + target);
    },

    _resolveTargets: function(targets) {
        var _this = this,
            buildTargets = [],
            nodeConfigs = this._projectConfig.getNodeConfigs(),
            nodePathsDesc = this._getNodePathsLenDesc();
        if (targets.length) {
            var targetIndex = {};
            targets.forEach(function(targetName) {
                var target = _this._resolveTarget(targetName, nodePathsDesc);
                if (targetIndex[target.node]) {
                    var currentTargetList = targetIndex[target.node].targets;
                    target.targets.forEach(function(resTargetName) {
                        if (currentTargetList.indexOf(resTargetName) == -1) {
                            currentTargetList.push(resTargetName);
                        }
                    });
                } else {
                    targetIndex[target.node] = target;
                    buildTargets.push(target);
                }
            });
        } else {
            Object.keys(nodeConfigs).forEach(function(nodePath) {
                buildTargets.push({
                    node: nodePath,
                    targets: ['*']
                });
            });
        }
        return buildTargets;
    },

    buildTargets: function(targets) {
        var _this = this;
        this._cache = new Cache(this._cacheStorage, this._projectName);
        try {
            var targetList = this._resolveTargets(targets);
            return Vow.all(targetList.map(function(target) {
                return _this.initNode(target.node);
            })).then(function(){
                return Vow.all(targetList.map(function(target) {
                    return _this._nodes[target.node].build(target.targets);
                }));
            });
        } catch (err) {
            return Vow.reject(err);
        }
    },

    cleanTargets: function(targets) {
        var _this = this;
        this._cache = new Cache(this._cacheStorage, this._projectName);
        try {
            var targetList = this._resolveTargets(targets);
            return Vow.all(targetList.map(function(target) {
                return _this.initNode(target.node);
            })).then(function(){
                return Vow.all(targetList.map(function(target) {
                    return _this._nodes[target.node].clean(target.targets);
                }));
            });
        } catch (err) {
            return Vow.reject(err);
        }
    },

    buildTask: function(taskName, args) {
        var task = this._projectConfig.getTaskConfig(taskName);
        task.setMakePlatform(this);
        return Vow.when(task.exec(args));
    },

    destruct: function() {},

    build: function(targets) {
        var promise = Vow.promise(), startTime = new Date(), _this = this, targetTask;
        try {
            this._logger.log('build started');
            if (targets.length && this._projectConfig.getTaskConfig(targets[0])) {
                targetTask = this.buildTask(targets[0], targets.slice(1));
            } else {
                targetTask = this.buildTargets(targets);
            }
            targetTask.then(function() {
                _this._logger.log('build finished - ' + colors.red((new Date() - startTime) + 'ms'));
                Object.keys(_this._nodes).forEach(function(nodeName) {
                    _this._nodes[nodeName].getLogger().setEnabled(false);
                });
                promise.fulfill();
            }, function(err) {
                _this._logger.log('build failed');
                promise.reject(err);
            });
        } catch (err) {
            promise.reject(err);
        }
        return promise;
    }
});
