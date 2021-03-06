'use strict';

const fs = require('fs');
const path = require('path');

const vow = require('vow');
const inherit = require('inherit');
const fileEval = require('file-eval');

const nodeFactory = require('./node');
const Logger = require('./logger');
const ProjectConfig = require('./config/project-config');
const Cache = require('./cache/cache');
const CacheStorage = require('./cache/cache-storage');
const vowFs = require('./fs/async-fs');
const BuildGraph = require('./ui/build-graph');
const BuildProfiler = require('./build-profiler');
const TargetNotFoundError = require('./errors/target-not-found-error');
const SharedResources = require('./shared-resources');

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

        const _this = this;
        const projectName = path.basename(cdir);
        const configDir = this._getConfigDir();
        const projectConfig = this._projectConfig = new ProjectConfig(cdir);

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
                const makefilePath = this._getMakeFile('make');
                const personalMakefilePath = this._getMakeFile('make.personal');

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

        const modeConfig = projectConfig.getModeConfig(mode);
        let modePromise;

        if (modeConfig) {
            modePromise = modeConfig.exec(null, projectConfig);
        }

        this._languages = projectConfig.getLanguages();
        this._env = projectConfig.getEnvValues();
        this._levelNamingSchemes = projectConfig.getLevelNamingSchemes();

        projectConfig.task('clean', function (task) {
            return task.cleanTargets([].slice.call(arguments, 1));
        });

        const tmpDir = path.join(configDir, 'tmp');

        return vowFs.makeDir(tmpDir).then(() => {
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
        const profiler = this._profiler;

        return {
            setStartTime(target, techName) {
                const filename = path.join(nodeName, target);

                return profiler.setStartTime(filename, techName);
            },
            setEndTime(target) {
                const filename = path.join(nodeName, target);

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
        const cdir = this.getDir();
        const possibleDirs = ['.enb', '.bem'];

        let configDir;
        const isConfigDirExists = possibleDirs.some(dir => {
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
        const configDir = this._getConfigDir();
        const possiblePrefixes = ['enb-', ''];

        let makeFile;
        const isMakeFileExists = possiblePrefixes.some(prefix => {
            makeFile = path.join(configDir, `${prefix + file}.js`);
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
        const version = this._getEnbVersion();
        const mtimes = this._cacheStorage.get(':make', 'makefiles') || {};
        let dropCache = false;
        // Invalidate cache if mode was changed.
        if (this._cacheStorage.get(':make', 'mode') !== this._mode) {
            dropCache = true;
        }
        // Invalidate cache if ENB package was updated.
        if (this._cacheStorage.get(':make', 'version') !== version) {
            dropCache = true;
        }
        // Invalidate cache if any of makefiles were updated.
        const currentMTimes = this._getMakefileMTimes();
        Object.keys(currentMTimes).forEach(makefilePath => {
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
        const res = {};
        this._makefiles.forEach(makefilePath => {
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
        const packageFilename = require.resolve('../package.json');

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
            const _this = this;
            const cdir = this.getDir();
            const nodeConfig = this._projectConfig.getNodeConfig(nodePath);
            const node = nodeFactory.mkNode(nodePath, this, this._cache, this._graph);

            if (this._profiler) {
                node.setProfiler(this.getNodeProfiler(nodePath));
            }

            node.setLogger(this._logger.subLogger(nodePath));
            this._nodes[nodePath] = node;
            this._nodeInitPromises[nodePath] = vowFs.makeDir(path.join(cdir, nodePath))
                .then(() => vow.when(nodeConfig.exec()))
                .then(() => vow.all(_this._projectConfig.getNodeMaskConfigs(nodePath).map(nodeMaskConfig => {
                    return nodeMaskConfig.exec([], nodeConfig);
                })))
                .then(() => {
                    const mode = nodeConfig.getModeConfig(_this._mode);
                    return mode && mode.exec(null, nodeConfig);
                })
                .then(() => {
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
        const _this = this;
        return this.initNode(nodePath).then(() => _this._nodes[nodePath].requireSources(sources));
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
        return Object.keys(this._projectConfig.getNodeConfigs()).sort((a, b) => b.length - a.length);
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
        for (let i = 0, l = nodePaths.length; i < l; i++) {
            const nodePath = nodePaths[i];
            if (target.indexOf(nodePath) === 0) {
                const npl = nodePath.length;
                const charAtNpl = target.charAt(npl);
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
        throw TargetNotFoundError(`Target not found: ${target}`);
    },

    /**
     * Вычисляет для списка таргетов, к каким нодам они принадлежат.
     * @param {String[]} targets
     * @returns {Object[]}
     * @private
     */
    _resolveTargets(targets) {
        const _this = this;
        const buildTargets = [];
        const nodeConfigs = this._projectConfig.getNodeConfigs();
        const nodePathsDesc = this._getNodePathsLenDesc();
        if (targets.length) {
            const targetIndex = {};
            targets.forEach(targetName => {
                const target = _this._resolveTarget(targetName, nodePathsDesc);
                if (targetIndex[target.node]) {
                    const currentTargetList = targetIndex[target.node].targets;
                    target.targets.forEach(resTargetName => {
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
            Object.keys(nodeConfigs).forEach(nodePath => {
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
        const _this = this;
        this._cache = new Cache(this._cacheStorage, this._projectName);

        try {
            const targetList = this._resolveTargets(targets);
            return vow.all(targetList.map(target => {
                return _this.initNode(target.node);
            })).then(() => {
                return vow.all(targetList.map(target => {
                    return _this._nodes[target.node].build(target.targets);
                })).then(builtInfoList => {
                    let builtTargets = [];

                    builtInfoList.forEach(builtInfo => {
                        builtTargets = builtTargets.concat(builtInfo.builtTargets);
                    });

                    return { builtTargets };
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
        const _this = this;
        this._cache = new Cache(this._cacheStorage, this._projectName);
        try {
            const targetList = this._resolveTargets(targets);
            return vow.all(targetList.map(target => {
                return _this.initNode(target.node);
            })).then(() => {
                return vow.all(targetList.map(target => {
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
        const task = this._projectConfig.getTaskConfig(taskName);
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
        const nodes = this._nodes;
        Object.keys(nodes).forEach(nodeName => {
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
        return path.sep === '/' ? targets : targets.map(target => target.replace(/\//g, '\\'));
    },

    /**
     * Запускает сборку.
     * Может запустить либо сборку таргетов, либо запуск тасков.
     * @param {String[]} targets
     * @returns {Promise}
     */
    build(targets) {
        targets = this._fixPath(targets);
        const deferred = vow.defer();
        const _this = this;
        let targetTask;
        try {
            if (targets.length && this._projectConfig.getTaskConfig(targets[0])) {
                targetTask = this.buildTask(targets[0], targets.slice(1));
            } else {
                targetTask = this.buildTargets(targets);
            }
            targetTask.then(() => {
                Object.keys(_this._nodes).forEach(nodeName => {
                    _this._nodes[nodeName].getLogger().setEnabled(false);
                });
                return deferred.resolve();
            }, err => deferred.reject(err));
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
