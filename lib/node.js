/**
 * Node
 * ====
 */
var Vow = require('vow');
var fs = require('fs');
var vowFs = require('./fs/async-fs');
var path = require('path');
var inherit = require('inherit');
var TargetNotFoundEror = require('./errors/target-not-found-error');

/**
 * Нода — директория, в которой происходит сборка. Например, сборка страницы.
 * Класс Node управляет сборкой в рамках ноды.
 * @name Node
 * @class
 */
module.exports = inherit( /** @lends Node.prototype */ {
    /**
     * Конструктор.
     * @param {String} nodePath
     * @param {MakePlatform} makePlatform
     * @param {Cache} cache
     */
    __constructor: function (nodePath, makePlatform, cache) {
        var root = makePlatform.getDir();
        /**
         * Ссылка на платформу.
         * @type {MakePlatform}
         * @name Node.prototype._makePlatform
         * @private
         */
        this._makePlatform = makePlatform;
        /**
         * Путь к директории с нодой относительно корня проекта.
         * @type {String}
         * @name Node.prototype._path
         * @private
         */
        this._path = nodePath;
        /**
         * Абсолютный путь к корню проекта.
         * @type {String}
         * @name Node.prototype._root
         * @private
         */
        this._root = root;
        /**
         * Абсолютный путь к директории с нодой.
         * @type {String}
         * @name Node.prototype._dirname
         * @private
         */
        this._dirname = path.resolve(root, nodePath);
        /**
         * Имя директории с нодой. Например, "index" для ноды "pages/index".
         * @type {String}
         * @name Node.prototype._targetName
         * @private
         */
        this._targetName = path.basename(nodePath);
        /**
         * Зарегистрированные технологии.
         * @type {Tech[]}
         * @name Node.prototype._techs
         * @private
         */
        this._techs = [];
        /**
         * Ссылка на кэш платформы.
         * @type {Cache}
         * @name Node.prototype._cache
         * @private
         */
        this._cache = cache;
        /**
         * Кэш для ноды.
         * @type {Cache}
         * @name Node.prototype._nodeCache
         * @private
         */
        this._nodeCache = cache.subCache(nodePath);
        /**
         * Логгер для ноды.
         * @type {Logger}
         * @name Node.prototype._logger
         * @private
         */
        this._logger = null;
        /**
         * Зарегистрированные таргеты со ссылками на технологии и с промисами на выполнение таргетов.
         * Формат:
         *  { 'index.js': { tech: <ссылка на технологию>, started: true|false, promise: <промис на выполнение> } }
         * @type {Object}
         * @name Node.prototype._targetNames
         * @private
         */
        this._targetNames = {};
        /**
         * Список таргетов на сборку.
         * @type {String[]}
         * @name Node.prototype._targetNamesToBuild
         * @private
         */
        this._targetNamesToBuild = [];
        /**
         * Список таргетов на удаление (для команды enb make clean).
         * @type {String[]}
         * @name Node.prototype._targetNamesToClean
         * @private
         */
        this._targetNamesToClean = [];
        // TODO: Удалить this._languages.
        /**
         * Список языков для ноды. Уже почти не используется в связи с переходом на новый формат настроек.
         * Будет удалено в будущих версиях.
         * @type {String[]}
         * @name Node.prototype._languages
         * @deprecated
         * @private
         */
        this._languages = null;
        /**
         * Промис на регистрацию всех таргетов для добавленных технологий.
         * @type {Promise}
         * @name Node.prototype._registerTargetsPromise
         * @private
         */
        this._registerTargetsPromise = null;
        /**
         * Построитель графа сборки.
         * @type {BuildGraph}
         * @name Node.prototype._graph
         * @private
         */
        this._graph = null;
    },

    /**
     * Внутреннее состояние текущей сборки. Используется для обмена данными между нодами.
     * @param {Object} buildState
     */
    setBuildState: function (buildState) {
        this.buildState = buildState;
    },

    /**
     * Устанавливает логгер для ноды (для того, чтобы логгировать ход сборки в консоль).
     * @param {Logger} logger
     * @returns {Node}
     */
    setLogger: function (logger) {
        this._logger = logger;
        return this;
    },

    /**
     * Возвращает логгер для ноды. Технологии могут пользоваться этим методов для дополнительного логгирования.
     * @returns {Logger}
     */
    getLogger: function () {
        return this._logger;
    },

    /**
     * Устанавливает языки для ноды.
     * @param {String[]} languages
     * @returns {Node}
     */
    setLanguages: function (languages) {
        this._languages = languages;
        return this;
    },

    /**
     * Возвращает языки для текущей ноды.
     * @returns {String[]}
     */
    getLanguages: function () {
        return this._languages;
    },

    /**
     * Возвращает абсолютный путь к директории с нодой.
     * @returns {String}
     */
    getDir: function () {
        return this._dirname;
    },

    /**
     * Возвращает абсолютный путь к директории с проектом.
     * @returns {String}
     */
    getRootDir: function () {
        return this._root;
    },

    /**
     * Возвращает относительный путь к директории с нодой (от корня проекта).
     * @returns {*}
     */
    getPath: function () {
        return this._path;
    },

    /**
     * Возвращает технологии, зарегистрированные для данной ноды.
     * @returns {Tech[]}
     */
    getTechs: function () {
        return this._techs;
    },

    /**
     * Устанавливает технологии для ноды.
     * @param {Tech[]} techs
     */
    setTechs: function (techs) {
        this._techs = techs;
    },

    /**
     * Устанавливает таргеты для сборки.
     * @param {String[]} targetsToBuild
     */
    setTargetsToBuild: function (targetsToBuild) {
        this._targetNamesToBuild = targetsToBuild;
    },

    /**
     * Устанавливает таргеты для удаления.
     * @param {String[]} targetsToClean
     */
    setTargetsToClean: function (targetsToClean) {
        this._targetNamesToClean = targetsToClean;
    },

    /**
     * Устанавливает построитель графа сборки.
     * @param {BuildGraph} graph
     * @returns {Node}
     */
    setBuildGraph: function (graph) {
        this._graph = graph;
        return this;
    },

    /**
     * Возвращает абсолютный путь к файлу, лежащему в директории с нодой.
     * @param {String} filename
     * @returns {String}
     */
    resolvePath: function (filename) {
        return this._dirname + path.sep + filename;
    },

    /**
     * Возвращает абсолютный путь к файлу, лежащему в директории с указанной нодой.
     * @param {String} nodePath Имя ноды (например, "pages/index").
     * @param {String} filename
     * @returns {String}
     */
    resolveNodePath: function (nodePath, filename) {
        return path.join(this._root, nodePath, filename);
    },

    /**
     * Демаскирует имя таргета для указанной ноды. Например, для ноды "pages/index" заменяет "?.js" на "index.js".
     * @param {String} nodePath Например, "pages/login".
     * @param {String} targetName
     * @returns {String}
     */
    unmaskNodeTargetName: function (nodePath, targetName) {
        return targetName.replace(/\?/g, path.basename(nodePath));
    },

    /**
     * Возвращает относительный ноды путь к файлу (заданному абсолютным путем).
     * @param {String} filename
     * @returns {String}
     */
    relativePath: function (filename) {
        var res = path.relative(path.join(this._root, this._path), filename);
        if (~res.indexOf('\\')) {
            res = res.replace(/\\/g, '/');
        }
        if (res.charAt(0) !== '.') {
            res = './' + res;
        }
        return res;
    },

    /**
     * Возвращает www-путь к файлу (заданному абсолютным путем).
     * @param {String} filename
     * @param {String} wwwRoot Адрес соответствующий корню проекта.
     * @returns {String}
     */
    wwwRootPath: function (filename, wwwRoot) {
        wwwRoot = wwwRoot || '/';
        return wwwRoot + path.relative(this._root, filename);
    },

    /**
     * Удаляет файл, лежащий в директории ноды. Вспомогательный метод для технологий.
     * @param {String} target
     */
    cleanTargetFile: function (target) {
        var targetPath = this.resolvePath(target);
        if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
            this.getLogger().logClean(target);
        }
    },

    /**
     * Создает временный файл для указанного таргета.
     * @param {String} targetName
     * @returns {String}
     */
    createTmpFileForTarget: function (targetName) {
        var dir = this._dirname;
        function createTmpFilename() {
            var prefix = '_tmp_' + (new Date()).getTime() + (Math.random() * 0x1000000000).toString(36) + '_';
            var filename = path.join(dir, prefix + targetName);
            return vowFs.exists(filename).then(function (exists) {
                if (exists) {
                    return createTmpFilename();
                } else {
                    return vowFs.write(filename, '').then(function () {
                        return filename;
                    });
                }
            });
        }
        return createTmpFilename();
    },

    /**
     * Инициализирует технологии, зарегистрированные в рамках ноды.
     * @returns {Promise}
     */
    loadTechs: function () {
        var _this = this;
        return Vow.all(this._techs.map(function (t) {
            var nodeMirrorClass = function () {};
            nodeMirrorClass.prototype = _this;
            var mirror = new nodeMirrorClass();
            return Vow.when(t.init(mirror)).then(function () {
                return Vow.when(t.getTargets()).then(function (targets) {
                    if (_this._graph) {
                        targets.forEach(function (target) {
                            var targetPath = path.join(_this._path, target);
                            _this._graph.addTarget(targetPath, t.getName());
                        });
                    }
                    var origRequireSources = _this.requireSources;
                    var origRequireNodeSources = _this.requireNodeSources;
                    mirror.requireSources = function (sources) {
                        if (_this._graph) {
                            targets.forEach(function (target) {
                                var targetPath = path.join(_this._path, target);
                                sources.forEach(function (source) {
                                    _this._graph.addDep(
                                        targetPath,
                                        path.join(_this._path, _this.unmaskTargetName(source))
                                    );
                                });
                            });
                        }
                        return origRequireSources.apply(_this, arguments);
                    };
                    mirror.requireNodeSources = function (sources) {
                        if (_this._graph) {
                            Object.keys(sources).forEach(function (nodeName) {
                                targets.forEach(function (target) {
                                    var targetPath = path.join(_this._path, target);
                                    sources[nodeName].forEach(function (source) {
                                        _this._graph.addDep(
                                            targetPath,
                                            path.join(nodeName, _this.unmaskNodeTargetName(nodeName, source))
                                        );
                                    });
                                });
                            });
                        }
                        return origRequireNodeSources.apply(_this, arguments);
                    };
                });
            });
        }));
    },

    /**
     * Возвращает техническую информацию об указанном таргете.
     * Формат результата: { tech: <ссылка на технологию>, started: true|false, promise: <промис на выполнение> }
     * @param {String} name Имя таргета.
     * @returns {Object}
     * @private
     */
    _getTarget: function (name) {
        var targets = this._targetNames;
        var target;
        if (!(target = targets[name])) {
            target = targets[name] = {started: false};
        }
        if (!target.promise) {
            target.promise = Vow.promise();
        }
        return target;
    },

    /**
     * Возвращает true, если таргет под указанным именем может быть собран. В противном случае возвращает false.
     * @param {String} name
     * @returns {Boolean}
     */
    hasRegisteredTarget: function (name) {
        return !!this._targetNames[name];
    },

    /**
     * Возвращает базовое имя таргета по умолчанию для ноды. Например, "index" для "pages/index".
     * Добавляет суффикс если не обходимо. Например, для "pages/index": node.getTargetName("js") -> index.js
     * @param {String} suffix
     * @returns {String}
     */
    getTargetName: function (suffix) {
        return this._targetName + (suffix ? '.' + suffix : '');
    },

    /**
     * Демаскирует имя таргета. Например, для ноды "pages/index" заменяет "?.js" на "index.js".
     * @param {String} targetName
     * @returns {String}
     */
    unmaskTargetName: function (targetName) {
        return targetName.replace(/\?/g, this._targetName);
    },

    /**
     * Регистрирует таргет для указанной технологии.
     * @param {String} target
     * @param {Tech} tech
     * @private
     */
    _registerTarget: function (target, tech) {
        var targetObj = this._getTarget(target);
        if (targetObj.tech) {
            throw Error(
                'Concurrent techs for target: ' + target + ', techs: "' + targetObj.tech.getName() +
                '" vs "' + tech.getName() + '"'
            );
        }
        targetObj.tech = tech;
    },

    /**
     * Оповещает ноду о том, что таргет собран. Технологии, которые зависят от этого таргета могут продолжить работу.
     * @param {String} target
     * @param {Object} [value]
     * @returns {Promise}
     */
    resolveTarget: function (target, value) {
        var targetObj = this._getTarget(target);
        if (!targetObj.isValid) {
            this._logger.logAction('rebuild', target, targetObj.tech.getName());
        }
        if (this._graph) {
            this._graph.resolveTarget(path.join(this._path, target));
        }
        return targetObj.promise.fulfill(value);
    },

    /**
     * Вывод сообщение в лог о том, что таргет не был пересобран, т.к. в этом нет нужды.
     * @param {String} target
     */
    isValidTarget: function (target) {
        var targetObj = this._getTarget(target);
        this._logger.isValid(target, targetObj.tech.getName());
        targetObj.isValid = true;
    },

    /**
     * Оповещает ноду о том, что таргет не удалось собрать. В этот метод следует передать ошибку.
     * @param {String} target
     * @param {Error} err
     * @returns {Promise}
     */
    rejectTarget: function (target, err) {
        var targetObj = this._getTarget(target);
        this._logger.logErrorAction('failed', target, targetObj.tech.getName());
        return targetObj.promise.reject(err);
    },

    /**
     * Требует выполнения таргетов для переданных нод.
     * Требование в формате: { "node/path": [ "target1", "target2", ... ], "another-node/path": ... }.
     * @param {Object} sourcesByNodes
     * @returns {Promise}
     */
    requireNodeSources: function (sourcesByNodes) {
        var _this = this;
        var resultByNodes = {};
        return Vow.all(Object.keys(sourcesByNodes).map(function (nodePath) {
            return _this._makePlatform.requireNodeSources(nodePath, sourcesByNodes[nodePath]).then(function (results) {
                resultByNodes[nodePath] = results;
            });
        })).then(function () {
            return resultByNodes;
        });
    },

    /**
     * Требует выполнения таргетов.
     * Требование в формате: ["target1", "target2", ...].
     * Например, node.requireSources(["index.js"]).then(...);
     * @param {String[]} sources
     * @returns {Promise}
     */
    requireSources: function (sources) {
        var _this = this;
        return this._registerTargets().then(function () {
            return Vow.all(sources.map(function (source) {
                source = _this.unmaskTargetName(source);
                var targetObj = _this._getTarget(source);
                if (!targetObj.tech) {
                    throw TargetNotFoundEror('There is no tech for target ' + path.join(_this._path, source + '.'));
                }
                if (!targetObj.started) {
                    targetObj.started = true;
                    if (!targetObj.tech.__started) {
                        targetObj.tech.__started = true;
                        try {
                            Vow.when(targetObj.tech.build()).fail(function (err) {
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

    /**
     * Удаляет таргеты с помощью технологий.
     * @param {String[]} targets
     * @returns {Promise}
     */
    cleanTargets: function (targets) {
        var _this = this;
        return Vow.all(targets.map(function (target) {
            var targetObj = _this._getTarget(target);
            if (!targetObj.tech) {
                throw Error('There is no tech for target ' + target + '.');
            }
            return Vow.when(targetObj.tech.clean());
        }));
    },

    /**
     * Регистрирует таргеты по имеющимся технологиям.
     * Часть инициализации ноды.
     * @returns {Promise}
     * @private
     */
    _registerTargets: function () {
        var _this = this;
        if (!this._registerTargetsPromise) {
            this._registerTargetsPromise = Vow.all(this._techs.map(function (t) {
                    return t.getTargets();
                })).then(function (targetLists) {
                    function registerTarget(targetName) {
                        _this._registerTarget(targetName, _this._techs[i]);
                    }
                    for (var i = 0, l = _this._techs.length; i < l; i++) {
                        targetLists[i].forEach(registerTarget);
                    }
                });
        }
        return this._registerTargetsPromise;
    },

    /**
     * Вычисляет список имен таргетов по переданным данным.
     * @param {String[]} targets Список целей (указанный в настройках сборки, например).
     * @param {String[]} defaultTargetList Полный список целей (для случая, когда указана маска "*").
     * @returns {String[]}
     * @private
     */
    _resolveTargets: function (targets, defaultTargetList) {
        var targetsToBuild = this._targetNamesToBuild;
        var _this = this;
        if (targets) {
            targetsToBuild = targets;
            targetsToBuild = [].concat.apply([], targetsToBuild.map(function (targetName) {
                if (targetName === '*') {
                    return (defaultTargetList.length ? defaultTargetList : Object.keys(_this._targetNames));
                } else {
                    return [targetName];
                }
            }));
        }
        if (!targetsToBuild) {
            targetsToBuild = Object.keys(this._targetNames);
        }
        targetsToBuild = targetsToBuild.filter(function (elem, pos) {
            return targetsToBuild.indexOf(elem) === pos;
        });
        return targetsToBuild;
    },

    /**
     * Запускает сборку указанных целей для ноды.
     * @param {String[]} targets
     * @returns {Promise}
     */
    build: function (targets) {
        var _this = this;
        var targetsToBuild = _this._resolveTargets(targets, _this._targetNamesToBuild);
        return this.requireSources(targetsToBuild)
            .then(function () {
                return {
                    builtTargets: targetsToBuild.map(function (target) {
                        return path.join(_this._path, target);
                    })
                };
            });
    },

    // TODO: Удалить параметр buildCache.
    /**
     * Запускает удаление указанных целей для ноды.
     * @param {String[]} targets
     * @param {Object} buildCache Вроде, лишний параметр, надо удалить.
     * @returns {Promise}
     */
    clean: function (targets, buildCache) {
        var _this = this;
        this.buildState = buildCache || {};
        return this._registerTargets().then(function () {
            return _this.cleanTargets(_this._resolveTargets(targets, _this._targetNamesToClean));
        });
    },

    /**
     * Возвращает кэш для таргета ноды. Этим методом могут пользоваться технологии для кэширования.
     * @param {String} subCacheName
     * @returns {Cache}
     */
    getNodeCache: function (subCacheName) {
        return subCacheName ? this._nodeCache.subCache(subCacheName) : this._nodeCache;
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
     * @returns {Object|undefined}
     */
    getLevelNamingScheme: function (levelPath) {
        return this._makePlatform.getLevelNamingScheme(levelPath);
    },

    destruct: function () {
        delete this._makePlatform;
        this._nodeCache.destruct();
        delete this._nodeCache;
        delete this._techs;
        delete this._graph;
    }
});
