/**
 * ProjectConfig
 * =============
 */
var fs = require('graceful-fs'),
    NodeConfig = require('./node-config'),
    NodeMaskConfig = require('./node-mask-config'),
    TaskConfig = require('./task-config'),
    ModeConfig = require('./mode-config'),
    inherit = require('inherit'),
    PATH = require('path'),
    dirGlob = require('../fs/dir-glob');

/**
 * Инстанции класса ProjectConfig передаются в enb-make-файлы.
 * С помощью инстанций этого класса производится настройка сборки проекта.
 * @name ProjectConfig
 */
module.exports = inherit( /** @lends ProjectConfig.prototype */ {

    /**
     * Конструктор.
     * @param {String} rootPath Путь к корню проекта.
     * @private
     */
    __constructor: function(rootPath) {
        this._rootPath = rootPath;
        this._nodeConfigs = {};
        this._tasks = {};
        this._nodeMaskConfigs = [];
        this._languages = null;
        this._modules = {};
        var env = this._env = {};
        this._modes = {};
        var processEnv = process.env;
        Object.keys(processEnv).forEach(function(key) {
            env[key] = processEnv[key];
        });
    },

    loadModule: function(name, setup) {
        var path = this.getRootPath() + '/node_modules/' + name;
        var module = this.includeConfig(path);
        setup && setup(module);
        return this;
    },

    registerModule: function(name, config) {
        var modules = this._modules;
        if (!modules.hasOwnProperty(name)) {
            modules[name] = config;
            return config;
        } else {
            throw Error('Module already exist: ' + name);
        }
    },

    module: function(name, setup) {
        var modules = this._modules;
        if (modules.hasOwnProperty(name)) {
            var config = modules[name];

            if (setup !== undefined) {
                setup(config);
                return this;
            } else {
                return config;
            }

        } else {
            throw Error('Module doesn\'t exist: ' + name);
        }
    },

    /**
     * Возвращает языки для проекта.
     * @returns {String[]}
     */
    getLanguages: function() {
        return this._languages;
    },

    /**
     * Устанавливает языки для проекта.
     * @param {String[]} languages
     * @returns {ProjectConfig}
     */
    setLanguages: function(languages) {
        this._languages = languages;
        return this;
    },

    /**
     * Возвращает путь к корню проекта.
     * @returns {String}
     */
    getRootPath: function() {
        return this._rootPath;
    },

    /**
     * Возвращает абсолютный путь к файлу на основе пути, относительно корня проекта.
     * @param {String|Object} path
     * @returns {String}
     */
    resolvePath: function(path) {
        if (path) {
            if (typeof path == 'string') {
                return this._rootPath + '/' + path;
            } else {
                path.path = this._rootPath + '/' + path.path;
                return path;
            }
        } else {
            return this._rootPath;
        }
    },

    /**
     * Объявляет ноду.
     * Необходимо объявить все ноды, используемые в сборке.
     * @param {String} path
     * @param {Function} func Конфигуратор ноды.
     * @returns {ProjectConfig}
     */
    node: function(path, func) {
        path = path.replace(/^\/+|\/+$/g, '');
        if (!this._nodeConfigs[path]) {
            this._nodeConfigs[path] = new NodeConfig(path, this._rootPath, this);
        }
        func && this._nodeConfigs[path].addChain(func);
        return this;
    },

    /**
     * Объявляет набор нод.
     * Ноды можно объявлять по shell-маске.
     * @param {String} path1 ,..
     * @param {Function} [func]
     * @returns {ProjectConfig}
     */
    nodes: function(path1, func) {
        var result;
        var input = arguments;
        var flat = false;
        var root = this._rootPath;
        var fn;
        while (!flat) {
            flat = true;
            result = [];
            for (var i = 0, l = input.length; i < l; i++) {
                var item = input[i];
                if (typeof item === 'function') {
                    fn = item;
                } else if (Array.isArray(item)) {
                    result = result.concat(item);
                    flat = false;
                } else if (item && typeof item === 'string') {
                    if (~item.indexOf('*')) {
                        result = result.concat(
                            dirGlob.globSync(root + '/' + item).map(function(path) {
                                return path.replace(root + '/', '');
                            })
                        )
                    } else {
                        result.push(item);
                    }
                }
            }
            input = result;
        }
        var _this = this;
        result.forEach(function(nodePath) {
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
    nodeMask: function(mask, func) {
        var nodeMask = new NodeMaskConfig(mask);
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
    task: function(name, func) {
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
    mode: function(name, func) {
        if (!this._modes[name]) {
            this._modes[name] = new ModeConfig(name);
        }
        this._modes[name].addChain(func);
        return this;
    },

    getTaskConfigs: function() {
        return this._tasks;
    },
    getTaskConfig: function(taskName) {
        return this._tasks[taskName];
    },
    getModeConfigs: function() {
        return this._modes;
    },
    getModeConfig: function(modeName) {
        return this._modes[modeName];
    },
    getNodeConfigs: function() {
        return this._nodeConfigs;
    },
    getNodeConfig: function(nodeName) {
        return this._nodeConfigs[nodeName];
    },
    getNodeMaskConfigs: function(nodePath) {
        return nodePath ? this._nodeMaskConfigs.filter(function (nodeMask) {
            return nodeMask.getMask().test(nodePath);
        }) : this._nodeMaskConfigs;
    },

    /**
     * Возвращает установленную переменную среды.
     * @param {String} key
     * @returns {String}
     */
    getEnv: function(key) {
        return this._env[key];
    },

    /**
     * Устанавливает переменные среды.
     * Переменные среды попадают в shell-команды в тасках.
     * @param {String} key
     * @param {String} value
     */
    setEnv: function(key, value) {
        var _this = this;
        if (typeof key === 'object') {
            Object.keys(key).forEach(function(name) {
                _this._env[name] = key[name];
            });
        } else {
            _this._env[key] = value;
        }
    },

    getEnvValues: function() {
        return this._env;
    },

    includeConfig: function(filename) {
        (this._includedConfigs || (this._includedConfigs = [])).push(filename);
        return require(filename)(this);
    },

    getIncludedConfigs: function() {
        return this._includedConfigs || [];
    }
});
