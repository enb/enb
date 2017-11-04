'use strict';

/**
 * BaseTech
 * ========
 */
const inherit = require('inherit');
const Vow = require('vow');

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
     * @param {Object} options
     */
    __constructor(options) {
        this._options = options || {};
    },

    /**
     * Инициализирует технологию.
     * @param {Node} node
     */
    init(node) {
        this.node = node;
        this.configure();
    },

    /**
     * Хэлпер для конфигурирования.
     */
    configure() {},

    /**
     * Возвращает значение опции.
     * @param {String} key
     * @param {Object} defaultValue
     * @returns {Object}
     */
    getOption(key, defaultValue) {
        return this._options.hasOwnProperty(key) ? this._options[key] : defaultValue;
    },

    /**
     * Возвращает значение опции. Кидает ошибку, если опция не указана.
     * @param {String} key
     * @returns {Object}
     */
    getRequiredOption(key) {
        if (!this._options.hasOwnProperty(key)) {
            throw Error(`Option "${key}" is required for technology "${this.getName()}".`);
        }
        return this._options[key];
    },

    /**
     * Метод, осуществляющий сборку. Возвращает промис.
     * Этот метод вызывается нодов для того, чтобы собрать таргет.
     * В рамках этого метода нужно прочитать все исходные файлы и записать результат в конечный файл.
     */
    build() {
        throw new Error('You are required to override build method of BaseTech.');
    },

    /**
     * Возвращает имя технологии.
     */
    getName() {
        throw new Error('You are required to override getName method of BaseTech.');
    },

    /**
     * Возвращает таргеты, которые может собрать технология.
     */
    getTargets() {
        throw new Error('You are required to override getTargets method of BaseTech.');
    },

    /**
     * Удаляет собранные таргеты.
     * @returns {Promise}
     */
    clean() {
        const _this = this;
        return Vow.all(this.getTargets().map(target => _this.node.cleanTargetFile(target)));
    }
});
