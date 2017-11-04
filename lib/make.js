'use strict';

var fs = require('fs');
var path = require('path');

var vow = require('vow');
var inherit = require('inherit');
var fileEval = require('file-eval');

var nodeFactory = require('./node');
var Logger = require('./logger');
var ProjectConfig = require('./config/project-config');
var Cache = require('./cache/cache');
var CacheStorage = require('./cache/cache-storage');
var vowFs = require('./fs/async-fs');
var BuildGraph = require('./ui/build-graph');
var BuildProfiler = require('./build-profiler');
var TargetNotFoundError = require('./errors/target-not-found-error');
var SharedResources = require('./shared-resources');

/**
 * MakePlatform
 * ============
 *
 * Класс MakePlatform управляет сборкой проекта.
 * В процессе инициализации загружается {CWD}/.bem/enb-make.js, в котором содержатся правила сборки.
 * @name MakePlatform
 * @class
 */
module.exports = inherit(/** @lends MakePlatform.prototype */ {

    /**
     * Конструктор.
     */
    __constructor() {
        this._nodes = {};
        this._nodeInitPromises = {};
        this._cacheStorage = null;
        this._cache = null;
        this._projectConfig = null;
        this._cdir = null;
        this._languages = null;
        this._env = {};
        this._mode = null;
        this._makefiles = [];
        this._graph = null;
        this._profiler = null;
        this._levelNamingSchemes = {};
        this._sharedResources = new SharedResources();
    },

    /**
     * Инициализация make-платформы.
     * Создает директорию для хранения временных файлов, загружает конфиг для сборки.
     * @param {String} cdir Путь к директории с проектом.
     * @param {String} [mode] Режим сборки. Например, development.
     * @param {Function} [config] Функция, которая инициирует конфиг сборки. По умолчанию загружается из `.enb/make.js`.
     * @param {Object} [opts]
     * @param {Boolean} [opts.graph=false]
     * @returns {Promise}
     */
    init(cdir, mode, config, opts) {
        opts = opts || {};

        this._mode = mode = mode || process.env.YENV || 'development';

        this._cdir = cdir;

        var _this = this;
        var projectName = path.basename(cdir);
        var configDir = this._getConfigDir();
        var projectConfig = this._projectConfig = new ProjectConfig(cdir);

        this._projectName = projectName;
        this._logger = new Logger();
        this._buildState = {};

        if (opts.graph || opts.profiler) {
            this._graph = new BuildGraph(projectName);
        }

        if (opts.profiler) {
            this._profiler = new BuildProfiler();
        }

        try {
            if (config) {
                config(projectConfig);
            } else {
                var makefilePath = this._getMakeFile('make');
                var personalMakefilePath = this._getMakeFile('make.personal');

                if (!makefilePath) {
                    throw new Error('Cannot find make configuration file.');
                }

                this._makefiles = [makefilePath, personalMakefilePath];

                fileEval.sync(makefilePath)(projectConfig);

                if (personalMakefilePath) {
                    fileEval.sync(personalMakefilePath)(projectConfig);
                }
            }
        } catch (err) {
            return vow.reject(err);
        }

        this._makefiles = this._makefiles.concat(projectConfig.getIncludedConfigFilenames());

        var modeConfig = projectConfig.getModeConfig(mode);
        var modePromise;

        if (modeConfig) {
            modePromise = modeConfig.exec(null, projectConfig);
        }

        this._languages = projectConfig.getLanguages();
        this._env = projectConfig.getEnvValues();
        this._levelNamingSchemes = projectConfig.getLevelNamingSchemes();

        projectConfig.task('clean', function (task) {
            return task.cleanTargets([].slice.call(arguments, 1));
        });

        var tmpDir = path.join(configDir, 'tmp');

        return vowFs.makeDir(tmpDir).then(function () {
            _this._cacheStorage = new CacheStorage(path.join(tmpDir, 'cache.json'));
            _this._nodes = {};

            return modePromise;
        });
    },

    /**
     * Возвращает профайлер для указанной ноды
     * @param {String} nodeName
     * @returns {?{setStartTime: function, setEndTime: function}}
     */
    getNodeProfiler(nodeName) {
        var profiler = this._profiler;

        return {
            setStartTime(target, techName) {
                var filename = path.join(nodeName, target);

                return profiler.setStartTime(filename, techName);
            },
            setEndTime(target) {
                var filename = path.join(nodeName, target);

                return profiler.setEndTime(filename);
            }
        };
    },

    /**
     * @returns {SharedResources}
     */
    getSharedResources() {
        return this._sharedResources;
    },

    /**
     * Возвращает абсолютный путь к директории с проектом.
     * @returns {String}
     */
    getDir() {
        return this._cdir;
    },

    /**
     * Возвращает абсолютный путь к директории с конфигурационными файлами.
     * В качестве директории ожидается либо .enb/, либо .bem/.
     * @returns {string}
     * @private
     */
    _getConfigDir() {
        var cdir = this.getDir();
        var possibleDirs = ['.enb', '.bem'];

        var configDir;
        var isConfigDirExists = possibleDirs.some(function (dir) {
            configDir = path.join(cdir, dir);
            return fs.existsSync(configDir);
        });

        if (isConfigDirExists) {
            return configDir;
        } else {
            throw new Error('Cannot find enb config directory. Should be either .enb/ or .bem/.');
        }
    },

    /**
     * Возвращает путь к указанному конфигу сборки.
     * Если файлов make.js и make.personal.js не существует, то пробуем искать файлы с префиксом enb-.
     * @param {String} file Название конфига (основной или персональный).
     * @returns {String}
     * @private
     */
    _getMakeFile(file) {
        var configDir = this._getConfigDir();
        var possiblePrefixes = ['enb-', ''];

        var makeFile;
        var isMakeFileExists = possiblePrefixes.some(function (prefix) {
            makeFile = path.join(configDir, prefix + file + '.js');
            return fs.existsSync(makeFile);
        });

        if (isMakeFileExists) {
            return makeFile;
        }
    },

    /**
     * Возвращает построитель графа сборки.
     * @returns {BuildGraph}
     */
    getBuildGraph() {
        return this._graph;
    },

    /**
     * Возвращает Инстанс BuildProfiler.
     * @returns {BuildProfiler}
     */
    getBuildProfiler() {
        return this._profiler;
    },

    /**
     * Загружает кэш из временной папки.
     * В случае, если обновился пакет enb, либо изменился режим сборки, либо изменились make-файлы, сбрасывается кэш.
     */
    loadCache() {
        this._cacheStorage.load();
        var version = this._getEnbVersion();
        var mtimes = this._cacheStorage.get(':make', 'makefiles') || {};
        var dropCache = false;
        // Invalidate cache if mode was changed.
        if (this._cacheStorage.get(':make', 'mode') !== this._mode) {
            dropCache = true;
        }
        // Invalidate cache if ENB package was updated.
        if (this._cacheStorage.get(':make', 'version') !== version) {
            dropCache = true;
        }
        // Invalidate cache if any of makefiles were updated.
        var currentMTimes = this._getMakefileMTimes();
        Object.keys(currentMTimes).forEach(function (makefilePath) {
            if (currentMTimes[makefilePath] !== mtimes[makefilePath]) {
                dropCache = true;
            }
        });
        if (dropCache) {
            this._cacheStorage.drop();
        }
    },

    /**
     * Возвращает время изменения каждого загруженного make-файла в виде unix-time (.bem/enb-make.js).
     * @returns {Object}
     * @private
     */
    _getMakefileMTimes() {
        var res = {};
        this._makefiles.forEach(function (makefilePath) {
            if (fs.existsSync(makefilePath)) {
                res[makefilePath] = fs.statSync(makefilePath).mtime.getTime();
            }
        });
        return res;
    },

    /**
     * Сохраняет кэш во временную папку.
     * @returns {undefined}
     */
    saveCache() {
        this._setCacheAttrs();
        return this._cacheStorage.save();
    },

    /**
     * Сохраняет кэш во временную папку асинхронно.
     * @returns {Promise}
     */
    saveCacheAsync() {
        this._setCacheAttrs();
        return this._cacheStorage.saveAsync();
    },

    _getEnbVersion() {
        var packageFilename = require.resolve('../package.json');

        return fileEval.sync(packageFilename).version;
    },

    _setCacheAttrs() {
        this._cacheStorage.set(':make', 'mode', this._mode);
        this._cacheStorage.set(':make', 'version', this._getEnbVersion());
        this._cacheStorage.set(':make', 'makefiles', this._getMakefileMTimes());
    },

    /**
     * Возвращает переменные окружения.
     * @returns {Object}
     */
    getEnv() {
        return this._env;
    },

    /**
     * Устанавливает переменные окружения.
     * @param {Object} env
     */
    setEnv(env) {
        this._env = env;
    },

    /**
     * Возвращает хранилище кэша.
     * @returns {CacheStorage}
     */
    getCacheStorage() {
        return this._cacheStorage;
    },

    /**
     * Устанавливает хранилище кэша.
     * @param {CacheStorage} cacheStorage
     */
    setCacheStorage(cacheStorage) {
        this._cacheStorage = cacheStorage;
    },

    /**
     * Возвращает языки для проекта.
     * Вроде, уже больше не нужно. Надо избавиться в будущих версиях.
     * @returns {String[]}
     * @deprecated
     */
    getLanguages() {
        return this._languages;
    },

    /**
     * Устанавливает языки для проекта.
     * Вроде, уже больше не нужно. Надо избавиться в будущих версиях.
     * @param {String[]} languages
     * @deprecated
     */
    setLanguages(languages) {
        this._languages = languages;
    },

    /**
     * Возвращает логгер для сборки.
     * @returns {Logger}
     */
    getLogger() {
        return this._logger;
    },

    /**
     * Устанавливает логгер для сборки.
     * Позволяет перенаправить вывод процесса сборки.
     *
     * @param {Logger} logger
     */
    setLogger(logger) {
        this._logger = logger;
    },

    /**
     * Инициализирует ноду по нужному пути.
     * @param {String} nodePath
     * @returns {Promise}
     */
    initNode(nodePath) {
        if (!this._nodeInitPromises[nodePath]) {
            var _this = this;
            var cdir = this.getDir();
            var nodeConfig = this._projectConfig.getNodeConfig(nodePath);
            var node = nodeFactory.mkNode(nodePath, this, this._cache, this._graph);

            if (this._profiler) {
                node.setProfiler(this.getNodeProfiler(nodePath));
            }

            node.setLogger(this._logger.subLogger(nodePath));
            this._nodes[nodePath] = node;
            this._nodeInitPromises[nodePath] = vowFs.makeDir(path.join(cdir, nodePath))
                .then(function () {
                    return vow.when(nodeConfig.exec());
                })
                .then(function () {
                    return vow.all(_this._projectConfig.getNodeMaskConfigs(nodePath).map(function (nodeMaskConfig) {
                        return nodeMaskConfig.exec([], nodeConfig);
                    }));
                })
                .then(function () {
                    var mode = nodeConfig.getModeConfig(_this._mode);
                    return mode && mode.exec(null, nodeConfig);
                })
                .then(function () {
                    node.setLanguages(nodeConfig.getLanguages() || _this._languages);
                    node.setTargetsToBuild(nodeConfig.getTargets());
                    node.setTargetsToClean(nodeConfig.getCleanTargets());
                    node.setTechs(nodeConfig.getTechs());
                    node.setBuildState(_this._buildState);
                    node.loadTechs();
                });
        }
        return this._nodeInitPromises[nodePath];
    },

    /**
     * Требует сборки таргетов для указанной ноды.
     * @param {String} nodePath Например, "pages/index".
     * @param {String[]} sources Таргеты, которые необходимо собрать.
     * @returns {Promise}
     */
    requireNodeSources(nodePath, sources) {
        var _this = this;
        return this.initNode(nodePath).then(function () {
            return _this._nodes[nodePath].requireSources(sources);
        });
    },

    /**
     * Сбрасывает кэш.
     */
    dropCache() {
        this._cacheStorage.drop();
    },

    /**
     * Возвращает массив строк путей к нодам, упорядоченные по убыванию длины.
     * Сортировка по убыванию нужна для случаев, когда на файловой системе одна нода находится
     * внутри другой (например, `bundles/page` и `bundles/page/bundles/header`).
     *
     * @returns {String[]}
     * @private
     */
    _getNodePathsLenDesc() {
        return Object.keys(this._projectConfig.getNodeConfigs()).sort(function (a, b) {
            return b.length - a.length;
        });
    },

    /**
     * Вычисляет (на основе переданного пути к таргету и списка путей к нодам)
     *  к какой ноде принадлежит переданный таргет.
     * @param {String} target
     * @param {String[]} nodePaths
     * @returns {{node: *, targets: String[]}}
     * @private
     */
    _resolveTarget(target, nodePaths) {
        target = target.replace(/^(\.\/)+|\/$/g, '');
        for (var i = 0, l = nodePaths.length; i < l; i++) {
            var nodePath = nodePaths[i];
            if (target.indexOf(nodePath) === 0) {
                var npl = nodePath.length;
                var charAtNpl = target.charAt(npl);
                if (target.length === npl) {
                    return {
                        node: nodePath,
                        targets: ['*']
                    };
                } else if (charAtNpl === '/' || charAtNpl === '\\') {
                    return {
                        node: nodePath,
                        targets: [target.substr(npl + 1)]
                    };
                }
            }
        }
        throw TargetNotFoundError('Target not found: ' + target);
    },

    /**
     * Вычисляет для списка таргетов, к каким нодам они принадлежат.
     * @param {String[]} targets
     * @returns {Object[]}
     * @private
     */
    _resolveTargets(targets) {
        var _this = this;
        var buildTargets = [];
        var nodeConfigs = this._projectConfig.getNodeConfigs();
        var nodePathsDesc = this._getNodePathsLenDesc();
        if (targets.length) {
            var targetIndex = {};
            targets.forEach(function (targetName) {
                var target = _this._resolveTarget(targetName, nodePathsDesc);
                if (targetIndex[target.node]) {
                    var currentTargetList = targetIndex[target.node].targets;
                    target.targets.forEach(function (resTargetName) {
                        if (currentTargetList.indexOf(resTargetName) === -1) {
                            currentTargetList.push(resTargetName);
                        }
                    });
                } else {
                    targetIndex[target.node] = target;
                    buildTargets.push(target);
                }
            });
        } else {
            Object.keys(nodeConfigs).forEach(function (nodePath) {
                buildTargets.push({
                    node: nodePath,
                    targets: ['*']
                });
            });
        }
        return buildTargets;
    },

    /**
     * Запускает сборку переданного списка таргетов.
     * @param {String[]} targets
     * @returns {Promise}
     */
    buildTargets(targets) {
        var _this = this;
        this._cache = new Cache(this._cacheStorage, this._projectName);
        try {
            var targetList = this._resolveTargets(targets);
            return vow.all(targetList.map(function (target) {
                return _this.initNode(target.node);
            })).then(function () {
                return vow.all(targetList.map(function (target) {
                    return _this._nodes[target.node].build(target.targets);
                })).then(function (builtInfoList) {
                    var builtTargets = [];

                    builtInfoList.forEach(function (builtInfo) {
                        builtTargets = builtTargets.concat(builtInfo.builtTargets);
                    });

                    return {
                        builtTargets
                    };
                });
            });
        } catch (err) {
            return vow.reject(err);
        }
    },

    /**
     * @returns {ProjectConfig}
     */
    getProjectConfig() {
        return this._projectConfig;
    },

    /**
     * Запускает удаление переданного списка таргетов.
     * @param {String[]} targets
     * @returns {Promise}
     */
    cleanTargets(targets) {
        var _this = this;
        this._cache = new Cache(this._cacheStorage, this._projectName);
        try {
            var targetList = this._resolveTargets(targets);
            return vow.all(targetList.map(function (target) {
                return _this.initNode(target.node);
            })).then(function () {
                return vow.all(targetList.map(function (target) {
                    return _this._nodes[target.node].clean(target.targets);
                }));
            });
        } catch (err) {
            return vow.reject(err);
        }
    },

    /**
     * Запускает выполнение таска.
     * @param {String} taskName
     * @param {String[]} args
     * @returns {Promise}
     */
    buildTask(taskName, args) {
        var task = this._projectConfig.getTaskConfig(taskName);
        task.setMakePlatform(this);
        return vow.when(task.exec(args));
    },

    /**
     * Деструктор.
     */
    destruct() {
        this._sharedResources.destruct();
        this._buildState = null;
        delete this._projectConfig;
        var nodes = this._nodes;
        Object.keys(nodes).forEach(function (nodeName) {
            nodes[nodeName].destruct();
        });
        delete this._nodes;
        if (this._cacheStorage) {
            this._cacheStorage.drop();
            delete this._cacheStorage;
        }
        if (this._cache) {
            this._cache.destruct();
            delete this._cache;
        }
        delete this._levelNamingSchemes;
    },

    /**
     * Заменяет слэши в путях к таргетам на обратные, если используется ОС Windows
     * @param {Array} targets
     * @returns {Array}
     */
    _fixPath(targets) {
        return path.sep === '/' ? targets : targets.map(function (target) {
            return target.replace(/\//g, '\\');
        });
    },

    /**
     * Запускает сборку.
     * Может запустить либо сборку таргетов, либо запуск тасков.
     * @param {String[]} targets
     * @returns {Promise}
     */
    build(targets) {
        targets = this._fixPath(targets);
        var deferred = vow.defer();
        var _this = this;
        var targetTask;
        try {
            if (targets.length && this._projectConfig.getTaskConfig(targets[0])) {
                targetTask = this.buildTask(targets[0], targets.slice(1));
            } else {
                targetTask = this.buildTargets(targets);
            }
            targetTask.then(function () {
                Object.keys(_this._nodes).forEach(function (nodeName) {
                    _this._nodes[nodeName].getLogger().setEnabled(false);
                });
                return deferred.resolve();
            }, function (err) {
                return deferred.reject(err);
            });
        } catch (err) {
            deferred.reject(err);
        }
        return deferred.promise();
    },

    /**
     * Возвращает схему именования для уровня переопределения.
     * Схема именования содержит два метода:
     * ```javascript
     * // Выполняет построение структуры файлов уровня переопределения, используя методы инстанции класса LevelBuilder.
     * {Promise} buildLevel( {String} levelPath, {LevelBuilder} levelBuilder )
     * // Возвращает путь к файлу на основе пути к уровню переопределения и BEM-описания.
     * {String} buildFilePath(
     *     {String} levelPath, {String} blockName, {String} elemName, {String} modName, {String} modVal
     * )
     * ```
     * @param {string} levelPath
     * @returns {Object|undefined}
     */
    getLevelNamingScheme(levelPath) {
        return this._levelNamingSchemes[levelPath];
    }
});
