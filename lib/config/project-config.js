'use strict';

/**
 * ProjectConfig
 * =============
 */
const NodeConfig = require('./node-config');
const NodeMaskConfig = require('./node-mask-config');
const TaskConfig = require('./task-config');
const ModeConfig = require('./mode-config');
const inherit = require('inherit');
const glob = require('glob');
const path = require('path');
const resolve = require('resolve');
const fileEval = require('file-eval');

/**
 * Инстанции класса ProjectConfig передаются в enb-make-файлы.
 * С помощью инстанций этого класса производится настройка сборки проекта.
 * @name ProjectConfig
 */
module.exports = inherit(/** @lends ProjectConfig.prototype */ {

    /**
     * Конструктор.
     * @param {String} rootPath Путь к корню проекта.
     * @private
     */
    __constructor(rootPath) {
        this._rootPath = rootPath;
        this._nodeConfigs = {};
        this._tasks = {};
        this._nodeMaskConfigs = [];
        this._languages = null;
        this._levelNamingSchemes = [];
        /**
         * @type {{ModuleConfig}}
         * @private
         */
        this._modules = {};
        const env = this._env = {};
        this._modes = {};
        const processEnv = process.env;
        Object.keys(processEnv).forEach(key => {
            env[key] = processEnv[key];
        });
    },

    /**
     * Возвращает языки для проекта.
     * @returns {String[]}
     */
    getLanguages() {
        return this._languages;
    },

    /**
     * Устанавливает языки для проекта.
     * @param {String[]} languages
     * @returns {ProjectConfig}
     */
    setLanguages(languages) {
        this._languages = languages;
        return this;
    },

    /**
     * Возвращает путь к корню проекта.
     * @returns {String}
     */
    getRootPath() {
        return this._rootPath;
    },

    /**
     * Возвращает абсолютный путь к файлу на основе пути, относительно корня проекта.
     * @param {string|Object} sourcePath
     * @returns {string}
     */
    resolvePath(sourcePath) {
        if (sourcePath) {
            if (typeof sourcePath === 'string') {
                return path.resolve(this._rootPath, sourcePath);
            } else {
                sourcePath.path = path.resolve(this._rootPath, sourcePath.path);
                return sourcePath;
            }
        } else {
            return this._rootPath;
        }
    },

    /**
     * Объявляет ноду.
     * Необходимо объявить все ноды, используемые в сборке.
     * @param {string} nodePath
     * @param {function} func Конфигуратор ноды.
     * @returns {ProjectConfig}
     */
    node(nodePath, func) {
        const slashRegExp = new RegExp(`^\\${path.sep}+|\\${path.sep}+$`, 'g');
        nodePath = nodePath.replace(slashRegExp, '');
        if (!this._nodeConfigs[nodePath]) {
            this._nodeConfigs[nodePath] = new NodeConfig(nodePath, this._rootPath, this);
        }
        if (func) {
            this._nodeConfigs[nodePath].addChain(func);
        }
        return this;
    },

    /**
     * Объявляет набор нод.
     * Ноды можно объявлять по shell-маске.
     * @param {String} path1 ,..
     * @param {Function} [func]
     * @returns {ProjectConfig}
     */
    nodes() {
        let result;
        let input = arguments;
        let flat = false;
        const root = this._rootPath;
        let fn;
        function toRelative(nodePath) {
            return path.normalize(nodePath).replace(root + path.sep, '');
        }
        while (!flat) {
            flat = true;
            result = [];
            for (let i = 0, l = input.length; i < l; i++) {
                const item = input[i];
                if (typeof item === 'function') {
                    fn = item;
                } else if (Array.isArray(item)) {
                    result = result.concat(item);
                    flat = false;
                } else if (item && typeof item === 'string') {
                    if (~item.indexOf('*')) {
                        result = result.concat(glob.sync(path.join(root, item)).map(toRelative));
                    } else {
                        result.push(item);
                    }
                }
            }
            input = result;
        }
        const _this = this;
        result.forEach(nodePath => {
            _this.node(nodePath, fn);
        });
        return this;
    },

    /**
     * Настраивает ноды по маске. Маска задается с помощью регулярного выражения.
     * Имейте ввиду, что ноды должны быть добавлены в конфигурацию проекта с помощью метода node или аналогов.
     * @param {RegExp} mask
     * @param {Function} func
     * @returns {ProjectConfig}
     */
    nodeMask(mask, func) {
        const nodeMask = new NodeMaskConfig(mask);
        nodeMask.addChain(func);
        this._nodeMaskConfigs.push(nodeMask);
        return this;
    },

    /**
     * Объявляет таск. Таск может быть выполнен с помощью ./node_modules/.bin/enb make task_name
     * @param {String} name
     * @param {Function} func
     * @returns {ProjectConfig}
     */
    task(name, func) {
        if (!this._tasks[name]) {
            this._tasks[name] = new TaskConfig(name);
        }
        this._tasks[name].addChain(func);
        return this;
    },

    /**
     * Конфигурирует проект для конкретного режима.
     * Режим задается с помощью ENV-переменной YENV.
     * @param {String} name
     * @param {Function} func
     * @returns {ProjectConfig}
     */
    mode(name, func) {
        if (!this._modes[name]) {
            this._modes[name] = new ModeConfig(name);
        }
        this._modes[name].addChain(func);
        return this;
    },

    /**
     * Регистрирует модуль.
     * @param {String} name
     * @param {ModuleConfig} moduleConfig
     */
    registerModule(name, moduleConfig) {
        if (!this._modules[name]) {
            this._modules[name] = moduleConfig;
        } else {
            throw new Error(`Module "${name}" is already registered.`);
        }
    },

    /**
     * Настраивает модуль.
     * @param {String} name
     * @param {Function} func
     * @returns {ProjectConfig|ModuleConfig}
     */
    module(name, func) {
        const module = this._modules[name];
        if (module) {
            if (func) {
                module.addChain(func);
                return this;
            } else {
                return module;
            }
        } else {
            throw new Error(`Module "${name}" is not registered.`);
        }
    },

    getTaskConfigs() {
        return this._tasks;
    },
    getTaskConfig(taskName) {
        return this._tasks[taskName];
    },
    getModeConfigs() {
        return this._modes;
    },
    getModeConfig(modeName) {
        return this._modes[modeName];
    },
    getNodeConfigs() {
        return this._nodeConfigs;
    },
    getNodeConfig(nodeName) {
        return this._nodeConfigs[nodeName];
    },
    getNodeMaskConfigs(nodePath) {
        return nodePath ? this._nodeMaskConfigs.filter(nodeMask => nodeMask.getMask().test(nodePath)) : this._nodeMaskConfigs;
    },

    /**
     * Возвращает установленную переменную среды.
     * @param {String} key
     * @returns {String}
     */
    getEnv(key) {
        return this._env[key];
    },

    /**
     * Устанавливает переменные среды.
     * Переменные среды попадают в shell-команды в тасках.
     * @param {String} key
     * @param {String} value
     */
    setEnv(key, value) {
        const _this = this;
        if (typeof key === 'object') {
            Object.keys(key).forEach(name => {
                _this._env[name] = key[name];
            });
        } else {
            _this._env[key] = value;
        }
    },

    getEnvValues() {
        return this._env;
    },

    /**
     * Подключает другой enb-make-файл с конфигурацией сборки.
     * @param {String} filename
     * @returns {ProjectConfig}
     */
    includeConfig(filename) {
        filename = resolve.sync(filename, { basedir: this._rootPath });
        (this._includedConfigFilenames || (this._includedConfigFilenames = [])).push(filename);
        fileEval.sync(filename)(this);
        return this;
    },

    /**
     * Возвращает список подключенных enb-make-файлов.
     * @returns {String[]}
     */
    getIncludedConfigFilenames() {
        return this._includedConfigFilenames || [];
    },

    /**
     * Устанавливает схему именования для уровня переопределения.
     * В функцию формирования схемы именования первым аргументом указывается абсолютный путь до уровня переопределения,
     * а вторым аргументом — инстанция LevelBuilder.
     * Схема именования должна содержать два метода:
     * ```javascript
     * // Выполняет построение структуры файлов уровня переопределения, используя методы инстанции класса LevelBuilder.
     * {Promise} buildLevel( {String} levelPath, {LevelBuilder} levelBuilder )
     * // Возвращает путь к файлу на основе пути к уровню переопределения и BEM-описания.
     * {String} buildFilePath(
     *     {String} levelPath, {String} blockName, {String} elemName, {String} modName, {String} modVal
     * )
     * ```
     * @param {string|Array} level
     * @param {function} schemeBuilder
     * @returns {ProjectConfig}
     */
    setLevelNamingScheme(level, schemeBuilder) {
        const levels = Array.isArray(level) ? level : [level];
        const _this = this;
        levels.forEach(levelPath => {
            if (levelPath.charAt(0) !== '/') {
                levelPath = _this.resolvePath(levelPath);
            }
            _this._levelNamingSchemes[levelPath] = schemeBuilder;
        });
        return this;
    },

    /**
     * Возвращает схемы именования для уровней переопределения.
     * @returns {Array}
     */
    getLevelNamingSchemes() {
        return this._levelNamingSchemes;
    }
});
