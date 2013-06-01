/**
 * ModuleConfig
 * ==========
 */
var inherit = require('inherit'),
    Vow = require('vow');

/**
 * ModuleConfig — конфигуратор модуля.
 * @name ModuleConfig
 */
module.exports = inherit(require('./configurable'), {

    /**
     * Конструктор.
     */
    __constructor: function() {
        this.__base();
    },

    getName: function() {
        throw new Error('You sould override "getName" method of module.');
    },

    /**
     * Выполняет цепочку коллбэков-конфигураторов.
     * В случае, если конфигуратор возвращает промис, выполнение происходит асинхронно.
     * @param {Object[]} args Аргументы, которые надо передавать в кажджый конфигуратор.
     * @param {Object} ctxObject Контекст выполнения. Передается первым параметром в конфигураторы.
     * @returns {Promise|undefined}
     */
    exec: function(args, ctxObject) {
        args = [ctxObject || this].concat(args || []);
        var chains = this._chains;
        function keepRunning() {
            var chain = chains.shift();
            return chain && Vow.when(chain.apply(this, args)).then(function() {
                return keepRunning();
            });
        }
        return keepRunning();
    }
});
