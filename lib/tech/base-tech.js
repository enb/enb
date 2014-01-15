/**
 * BaseTech
 * ========
 */
var inherit = require('inherit'),
    Vow = require('vow');

/**
 * Базовая технология.
 * Предлагает методы для работы с опциями.
 * От нее наследоваться не обязательно.
 * @name BaseTech
 * @type {Tech}
 */
module.exports = inherit({

    /**
     * Конструктор.
     * В конструктор передаются опции из enb-make.js.
     * @param options
     */
    __constructor: function (options) {
        this._options = options || {};
    },

    /**
     * Инициализирует технологию.
     * @param {Node} node
     */
    init: function (node) {
        this.node = node;
        this.configure();
    },

    /**
     * Хэлпер для конфигурирования.
     */
    configure: function () {},

    /**
     * Возвращает значение опции.
     * @param {String} key
     * @param {Object} defaultValue
     * @returns {Object}
     */
    getOption: function (key, defaultValue) {
        return this._options.hasOwnProperty(key) ? this._options[key] : defaultValue;
    },

    /**
     * Возвращает значение опции. Кидает ошибку, если опция не указана.
     * @param {String} key
     * @returns {Object}
     */
    getRequiredOption: function (key) {
        if (!this._options.hasOwnProperty(key)) {
            throw Error('Option "' + key + '" is required for technology "' + this.getName() + '".');
        }
        return this._options[key];
    },

    /**
     * Метод, осуществляющий сборку. Возвращает промис.
     * Этот метод вызывается нодов для того, чтобы собрать таргет.
     * В рамках этого метода нужно прочитать все исходные файлы и записать результат в конечный файл.
     * @returns {Promise}
     */
    build: function () {
        throw new Error('You are required to override build method of BaseTech.');
    },

    /**
     * Возвращает имя технологии.
     */
    getName: function () {
        throw new Error('You are required to override getName method of BaseTech.');
    },

    /**
     * Возвращает таргеты, которые может собрать технология.
     */
    getTargets: function () {
        throw new Error('You are required to override getTargets method of BaseTech.');
    },

    /**
     * Удаляет собранные таргеты.
     * @returns {Promise}
     */
    clean: function () {
        var _this = this;
        return Vow.all(this.getTargets().map(function (target) {
            _this.node.cleanTargetFile(target);
        }));
    }
});
