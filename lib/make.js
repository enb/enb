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
    this._nodes = [];
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

        var env = {},
            nodes = projectConfig.getNodeConfigs(),
            tmpDir = cdir + '/.bem/tmp';

        mkdirp(tmpDir, function(err) {
            if (err) {
                return promise.reject(err);
            }

            _this._cacheStorage = new CacheStorage(cacheFilename = tmpDir + '/cache.js');
            _this._cacheStorage.load();
            _this._cache = new Cache(_this._cacheStorage, projectName);
            _this._nodes = {};

            Object.keys(nodes).map(function(nodePath) {
                _this.initNode(nodePath);
            });

            Vow.all(Object.keys(_this._nodes).map(function(n) {
                return _this._nodes[n].loadTechs();
            })).then((function() {
                promise.fulfill();
            }), function(err) {
                promise.reject(err);
            });
        });
        return promise;
    },

    initNode: function(nodePath) {
        if (!this._nodes[nodePath]) {
            var nodeConfig = this._projectConfig.getNodeConfig(nodePath),
                node = new Node(nodePath, this._cdir + '/' + nodePath, nodeConfig.getTechs(), this._cache);
            node.setLogger(this._logger.subLogger(nodePath));
            node.setEnv({});
            node.setTargetsToBuild(nodeConfig.getTargets());
            this._nodes[nodePath] = node;
        }
    },

    dropCache: function() {
        this._cacheStorage.drop();
    },

    build: function(target) {
        var startTime = new Date(),
            targetFile = null,
            nodes = this._nodes,
            nodesToBuild = Object.keys(nodes).map(function(nodeName) { return nodes[nodeName]; });
        if (target) {
            target = target.replace(/^\/+|\/+$/g,'');
            var lt = target.length;
            nodesToBuild = nodesToBuild.filter(function(node) {
                var path = node.getPath();
                if (target.indexOf(path) != -1) {
                    if (lt != path.length) {
                        if (target.charAt(path.length) == '/') {
                            targetFile = target.substr(path.length + 1);
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            });
        }
        var promise = Vow.promise(),
            _this = this;
        this.buildCache = {};
        this._logger.log('build started');
        Vow.all(nodesToBuild.map(function(n) {
            return n.build(targetFile, _this.buildCache);
        })).then((function() {
            _this._logger.log('build finished - ' + colors.red((new Date() - startTime) + 'ms'));
            _this._cacheStorage.save();
            return promise.fulfill();
        }), function(err) {
            _this._logger.log('build failed');
            promise.reject(err);
        });
        return promise;
    }
};

module.exports = MakePlatform;
