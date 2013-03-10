var Vow = require('vow'),
    Node = require('./node'),
    Level = require('./level'),
    path = require('path'),
    Logger = require('./logger'),
    colors = require('colors'),
    ProjectConfig = require('./config/project-config'),
    mkdirp = require('mkdirp'),
    Cache = require('./cache/cache'),
    CacheStorage = require('./cache/cache-storage');

function MakePlatform() {
    this._nodes = {};
    this._nodeInitPromises = {};
    this._cacheStorage = null;
    this._cache = null;
    this._projectConfig = null;
    this._cdir = null;
}

MakePlatform.prototype = {
    init: function(cdir) {
        this._cdir = cdir;

        var _this = this
            promise = Vow.promise(),
            projectName = path.basename(cdir);

        this._logger = new Logger(projectName);
        projectConfig = this._projectConfig = new ProjectConfig(cdir);

        try {
            require(cdir + '/.bem/altmake')(projectConfig);
        } catch (err) {
            promise.reject(err);
        }

        projectConfig.task('clean', function(task) {
            return task.cleanTargets([].slice.call(arguments, 1));
        });

        var nodes = projectConfig.getNodeConfigs(),
            tmpDir = cdir + '/.bem/tmp';

        mkdirp(tmpDir, function(err) {
            if (err) return promise.reject(err);

            _this._cacheStorage = new CacheStorage(cacheFilename = tmpDir + '/cache.js');
            _this._cacheStorage.load();
            _this._cache = new Cache(_this._cacheStorage, projectName);
            _this._nodes = {};

            promise.fulfill();
        });
        return promise;
    },

    getLogger: function() {
        return this._logger;
    },

    initNode: function(nodePath) {
        if (!this._nodeInitPromises[nodePath]) {
            var _this = this,
                nodeConfig = this._projectConfig.getNodeConfig(nodePath),
                node = new Node(nodePath, this._cdir + '/' + nodePath, this._cache);
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
                    node.setTargetsToBuild(nodeConfig.getTargets());
                    node.setTargetsToClean(nodeConfig.getCleanTargets());
                    node.setTechs(nodeConfig.getTechs());
                    return node.loadTechs();
                });
        }
        return this._nodeInitPromises[nodePath];
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
                    currentTargetList = targetIndex[target.node].targets;
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
        try {
            var targetList = this._resolveTargets(targets);
            this._buildState = {};
            return Vow.all(targetList.map(function(target) {
                return _this.initNode(target.node);
            })).then(function(){
                return Vow.all(targetList.map(function(target) {
                    return _this._nodes[target.node].build(target.targets, _this._buildState);
                }));
            });
        } catch (err) {
            return Vow.reject(err);
        }
    },

    cleanTargets: function(targets) {
        var _this = this;
        try {
            var targetList = this._resolveTargets(targets);
            this._buildState = {};
            return Vow.all(targetList.map(function(target) {
                return _this.initNode(target.node);
            })).then(function(){
                return Vow.all(targetList.map(function(target) {
                    return _this._nodes[target.node].clean(target.targets, _this._buildState);
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
                _this._cacheStorage.save();
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
};

module.exports = MakePlatform;
