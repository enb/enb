'use strict';

/**
 * TaskConfig
 * ==========
 */
const inherit = require('inherit');
const childProcess = require('child_process');
const vow = require('vow');

/**
 * TaskConfig — конфигуратор таска.
 * @name TaskConfig
 */
module.exports = inherit(require('./configurable'), {

    /**
     * Конструктор.
     * @param {String} name Имя таска.
     */
    __constructor(name) {
        this.__base();
        this._name = name;
        this._makePlatform = null;
        this._logger = null;
    },

    getMakePlatform() {
        return this._makePlatform;
    },

    setMakePlatform(makePlatform) {
        this._makePlatform = makePlatform;
        this._logger = makePlatform.getLogger().subLogger(`:${this._name}`);
    },

    /**
     * Логгирует сообщение в консоль.
     * @param {String} msg
     */
    log(msg) {
        this._logger.log(msg);
    },

    /**
     * Запускает сборку таргетов. Возвращает промис.
     * @param {String[]} targets
     * @returns {Promise}
     */
    buildTargets(targets) {
        return this._makePlatform.buildTargets(targets);
    },

    /**
     * Запускает сборку таргета. Возвращает промис.
     * @param {String} target
     * @returns {Promise}
     */
    buildTarget(target) {
        return this.buildTargets([target]);
    },

    /**
     * Запускает удаление таргетов. Возвращает промис.
     * @param {String[]} targets
     * @returns {Promise}
     */
    cleanTargets(targets) {
        return this._makePlatform.cleanTargets(targets);
    },

    /**
     * Запускает удаление таргета. Возвращает промис.
     * @param {String} target
     * @returns {Promise}
     */
    cleanTarget(target) {
        return this.cleanTargets([target]);
    },

    /**
     * Выполняет shell-команду. Возвращает промис.
     * @param {String} shellCmd
     * @param {Object} opts
     * @returns {Promise}
     */
    shell(shellCmd, opts) {
        opts = opts || {};
        const env = {};
        const specifiedEnv = opts.env || {};
        const baseEnv = this._makePlatform.getEnv() || {};

        Object.keys(baseEnv).forEach(function (key) {
            env[key] = baseEnv[key];
        });
        Object.keys(specifiedEnv).forEach(function (key) {
            env[key] = specifiedEnv[key];
        });
        opts.env = env;

        this.log(`$ ${shellCmd}`);

        return new vow.Promise(function (resolve, reject) {
            const shellProcess = childProcess.exec(shellCmd, opts);
            let stdout = '';
            let stderr = '';

            shellProcess.on('close', function (code) {
                if (code === 0) {
                    resolve([stdout, stderr]);
                } else {
                    reject(new Error(stderr));
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
        });
    }
});
