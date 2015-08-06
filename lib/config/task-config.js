/**
 * TaskConfig
 * ==========
 */
var inherit = require('inherit');
var childProcess = require('child_process');
var Vow = require('vow');

/**
 * TaskConfig — конфигуратор таска.
 * @name TaskConfig
 */
module.exports = inherit(require('./configurable'), {

    /**
     * Конструктор.
     * @param {String} name Имя таска.
     */
    __constructor: function (name) {
        this.__base();
        this._name = name;
        this._makePlatform = null;
        this._logger = null;
    },

    getMakePlatform: function () {
        return this._makePlatform;
    },

    setMakePlatform: function (makePlatform) {
        this._makePlatform = makePlatform;
        this._logger = makePlatform.getLogger().subLogger(':' + this._name);
    },

    /**
     * Логгирует сообщение в консоль.
     * @param {String} msg
     */
    log: function (msg) {
        this._logger.log(msg);
    },

    /**
     * Запускает сборку таргетов. Возвращает промис.
     * @param {String[]} targets
     * @returns {Promise}
     */
    buildTargets: function (targets) {
        return this._makePlatform.buildTargets(targets);
    },

    /**
     * Запускает сборку таргета. Возвращает промис.
     * @param {String} target
     * @returns {Promise}
     */
    buildTarget: function (target) {
        return this.buildTargets([target]);
    },

    /**
     * Запускает удаление таргетов. Возвращает промис.
     * @param {String[]} targets
     * @returns {Promise}
     */
    cleanTargets: function (targets) {
        return this._makePlatform.cleanTargets(targets);
    },

    /**
     * Запускает удаление таргета. Возвращает промис.
     * @param {String} target
     * @returns {Promise}
     */
    cleanTarget: function (target) {
        return this.cleanTargets([target]);
    },

    /**
     * Выполняет shell-команду. Возвращает промис.
     * @param {String} shellCmd
     * @param {Object} opts
     * @returns {Promise}
     */
    shell: function (shellCmd, opts) {
        opts = opts || {};
        var env = {};
        var specifiedEnv = opts.env || {};
        var baseEnv = this._makePlatform.getEnv() || {};

        Object.keys(baseEnv).forEach(function (key) {
            env[key] = baseEnv[key];
        });
        Object.keys(specifiedEnv).forEach(function (key) {
            env[key] = specifiedEnv[key];
        });
        opts.env = env;

        this.log('$ ' + shellCmd);

        var shellProcess = childProcess.exec(shellCmd, opts);
        var promise = Vow.promise();
        var stdout = '';
        var stderr = '';

        shellProcess.on('close', function (code) {
            if (code === 0) {
                promise.fulfill([stdout, stderr]);
            } else {
                promise.reject(new Error(stderr));
            }
        });

        shellProcess.stderr.on('data', function (data) {
            stderr += data;
            console.log(data.trim());
        });

        shellProcess.stdout.on('data', function (data) {
            console.log(data.trim());
            stdout += data;
        });

        return promise;
    }
});
