'use strict';

/**
 * Configurable
 * ============
 */
var inherit = require('inherit');
var Vow = require('vow');

/**
 * Configurable — базовый для классов, конфигурируемых коллбэками.
 * @name Configurable
 */
module.exports = inherit(/** @lends Configurable.prototype */ {

    /**
     * Конструктор.
     */
    __constructor() {
        this._chains = [];
    },

    /**
     * Добавляет коллбэк конфигурации.
     * @param {function} cb
     * @returns {Configurable}
     */
    addChain(cb) {
        this._chains.push(cb);
        return this;
    },

    /**
     * Алиас к addChain.
     * @param {...function} cb
     * @returns {Configurable}
     */
    configure() {
        return this.addChain.apply(this, arguments);
    },

    /**
     * Выполняет цепочку коллбэков-конфигураторов.
     * В случае, если конфигуратор возвращает промис, выполнение происходит асинхронно.
     * @param {Object[]} args Аргументы, которые надо передавать в кажджый конфигуратор.
     * @param {Object} ctxObject Контекст выполнения. Передается первым параметром в конфигураторы.
     * @returns {Promise|undefined}
     */
    exec(args, ctxObject) {
        args = [ctxObject || this].concat(args || []);
        var chains = this._chains.slice(0);
        function keepRunning() {
            var chain = chains.shift();
            return chain && Vow.when(chain.apply(this, args)).then(function () {
                return keepRunning();
            });
        }
        return keepRunning();
    }
});
