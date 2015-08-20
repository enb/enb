var path = require('path');
var inherit = require('inherit');
var TestLogger = require('./test-logger');
var vow = require('vow');
var CacheStorage = require('../../cache/cache-storage');
var Cache = require('../../cache/cache');
var asyncFs = require('../../fs/async-fs');
var dropRequireCache = require('../../fs/drop-require-cache');
var deprecate = require('../../utils/deprecate');

deprecate({module: 'test-node', since: 'v1.0.0', replaceModule: 'mock-enb package'});

/**
 * @name TestNode
 * @deprecated
 */
module.exports = inherit({
    __constructor: function (nodePath) {
        this._languages = [];
        this._logger = new TestLogger(nodePath);
        this._root = process.cwd();
        this._path = nodePath;
        this._dirname = path.join(this._root, nodePath);
        this._targetName = path.basename(nodePath);
        this._buildPromise = vow.promise();
        this._buildPromises = [];
        this._nodeCache = new Cache(new CacheStorage(), nodePath);
        this._techData = {};
        this._resultTechData = {};
        this._nodeTechData = {};
        this._levelNamingSchemes = {};
        this.buildState = {};
    },
    getLanguages: function () {
        return this._languages;
    },
    setLanguages: function (languages) {
        this._languages = languages;
    },
    getLogger: function () {
        return this._logger;
    },
    setLogger: function (logger) {
        this._logger = logger;
    },
    getRootDir: function () {
        return this._root;
    },
    getDir: function () {
        return this._dirname;
    },
    getPath: function () {
        return this._path;
    },
    getTechs: function () {
        throw new Error('Method `getTechs` is not implemented.');
    },
    setTechs: function () {
        throw new Error('Method `setTechs` is not implemented.');
    },
    setTargetsToBuild: function () {
        throw new Error('Method `setTargetsToBuild` is not implemented.');
    },
    setTargetsToClean: function () {
        throw new Error('Method `setTargetsToClean` is not implemented.');
    },
    setBuildGraph: function () {
        throw new Error('Method `setBuildGraph` is not implemented.');
    },
    resolvePath: function (filename) {
        return path.join(this._dirname, filename);
    },
    resolveNodePath: function (nodePath, filename) {
        return path.join(this._root, nodePath, filename);
    },
    unmaskNodeTargetName: function (nodePath, targetName) {
        return targetName.replace(/\?/g, path.basename(nodePath));
    },
    relativePath: function (filename) {
        var res = path.relative(path.join(this._root, this._path), filename);
        if (res.charAt(0) !== '.') {
            res = '.' + path.sep + res;
        }
        return res;
    },
    unmaskTargetName: function (targetName) {
        return targetName.replace(/\?/g, this._targetName);
    },
    getTargetName: function (suffix) {
        return this._targetName + (suffix ? '.' + suffix : '');
    },
    wwwRootPath: function (filename, wwwRoot) {
        wwwRoot = wwwRoot || '/';
        return wwwRoot + path.relative(this._root, filename);
    },
    cleanTargetFile: function () {
        throw new Error('Method `cleanTargetFile` is not implemented.');
    },
    createTmpFileForTarget: function () {
        throw new Error('Method `createTmpFileForTarget` is not implemented.');
    },
    loadTechs: function () {
        throw new Error('Method `loadTechs` is not implemented.');
    },
    hasRegisteredTarget: function () {
        throw new Error('Method `hasRegisteredTarget` is not implemented.');
    },
    resolveTarget: function (target, value) {
        this._resultTechData[target] = value;
        this._buildPromise.fulfill(value);
        this._buildPromises.push(vow.resolve(value));
    },
    isValidTarget: function (targetName) {
        this._logger.isValid(targetName);
    },
    rejectTarget: function (targetName, error) {
        this._buildPromise.reject(error);
    },
    requireNodeSources: function (sourcesByNodes) {
        var resultByNodes = {};

        Object.keys(sourcesByNodes).forEach(function (nodePath) {
            resultByNodes[nodePath] = sourcesByNodes[nodePath].map(function (target) {
                var node = this._nodeTechData[nodePath];
                return node && node[target];
            }, this);
        }, this);

        return vow.fulfill(resultByNodes);
    },
    requireSources: function (sources) {
        return vow.all(sources.map(function (source) {
            return vow.fulfill(this._techData[source]);
        }, this));
    },
    cleanTargets: function () {
        throw new Error('Method `cleanTargets` is not implemented.');
    },
    build: function () {
        throw new Error('Method `build` is not implemented.');
    },
    clean: function () {
        throw new Error('Method `clean` is not implemented.');
    },
    getNodeCache: function (subCacheName) {
        return subCacheName ? this._nodeCache.subCache(subCacheName) : this._nodeCache;
    },
    getLevelNamingScheme: function (levelPath) {
        return this._levelNamingSchemes[levelPath];
    },
    destruct: function () {
        throw new Error('Method `destruct` is not implemented.');
    },

    provideTechData: function (targetName, value) {
        targetName = this.unmaskTargetName(targetName);
        this._techData[targetName] = value;
    },
    provideNodeTechData: function (node, targetName, value) {
        targetName = this.unmaskTargetName(targetName);

        if (!this._nodeTechData[node]) {
            this._nodeTechData[node] = {};
        }
        this._nodeTechData[node][targetName] = value;
    },
    provideLevelNamingScheme: function (level, schemeBuilder) {
        var levels = Array.isArray(level) ? level : [level];
        var _this = this;
        levels.forEach(function (levelPath) {
            if (levelPath.charAt(0) !== path.sep) {
                levelPath = _this.resolvePath(levelPath);
            }
            _this._levelNamingSchemes[levelPath] = schemeBuilder;
        });
        return this;
    },
    runTech: function (TechClass, options) {
        options = options || {};
        var tech = new TechClass(options);
        tech.init(this);
        return vow.fulfill().then(function () {
            return vow.when(tech.build()).then(function () {
                return this._buildPromise;
            }.bind(this));
        }.bind(this));
    },
    runTechAndGetResults: function (TechClass, options) {
        options = options || {};
        var tech = new TechClass(options);
        tech.init(this);
        return vow.fulfill().then(function () {
            return vow.when(tech.build()).then(function () {
                return vow.all(this._buildPromises).then(function () {
                    var resultByTargets = {};
                    tech.getTargets().forEach(function (targetName) {
                        resultByTargets[targetName] = this._resultTechData[targetName];
                    }, this);
                    return resultByTargets;
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    runTechAndGetContent: function (TechClass, options) {
        options = options || {};
        var node = this;
        var tech = new TechClass(options);
        tech.init(this);
        return vow.fulfill().then(function () {
            return vow.when(tech.build()).then(function () {
                return this._buildPromise.then(function () {
                    return vow.all(tech.getTargets().map(function (targetName) {
                        return asyncFs.read(node.resolvePath(targetName));
                    }, this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    runTechAndRequire: function (TechClass, options) {
        options = options || {};
        var node = this;
        var tech = new TechClass(options);
        tech.init(this);
        return vow.fulfill().then(function () {
            return vow.when(tech.build()).then(function () {
                return this._buildPromise.then(function () {
                    return vow.all(tech.getTargets().map(function (targetName) {
                        var filename = node.resolvePath(targetName);
                        dropRequireCache(require, filename);
                        return require(filename);
                    }, this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }
});
