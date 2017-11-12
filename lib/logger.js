'use strict';

/**
 * Logger
 * ======
 */

const inherit = require('inherit');
const path = require('path');

const colors = require('./ui/colorize');
const LOG_LEVELS = ['info', 'warn', 'error'];

/**
 * Логгер. В данной реализации — обертка над console.log.
 * Выводит в консоль процесс сборки проекта.
 * @name Logger
 */
const Logger = module.exports = inherit(/** @lends Logger.prototype */ {
    /**
     * Конструктор.
     * На основе одного логгера можно создать вложенный логгер с помощью аргумента scope.
     * Если указан scope, то scope будет выводиться при логгировании.
     * @param {String} scope
     * @param {Object} options
     * @private
     */
    __constructor(scope, options) {
        this._scope = scope || '';
        this._enabled = true;
        this._options = options || {};

        if (!this._options.logLevel) {
            this._options.logLevel = process.env.ENB_LOG_LEVEL || LOG_LEVELS[0];
        }
    },

    /**
     * @param {string} msg
     * @param {string} [scope]
     * @param {string} [action]
     * @returns {string}
     */
    _buildMessage(msg, scope, action) {
        const dt = new Date();

        scope = scope || this._scope;
        action = action || '';

        const hasFileLocation = /:\d+:\d+$/.test(scope);

        return colors.gray(
            zeros(dt.getHours(), 2) + ':' +
            zeros(dt.getMinutes(), 2) + ':' +
            zeros(dt.getSeconds(), 2) + '.' +
            zeros(dt.getMilliseconds(), 3) + ' - '
        ) +
        (action && action + ' ') +
        (scope && ('[' +
            colors.blue(
                hasFileLocation
                    ? scope
                    : scope.replace(/(:.+)$/, (s, g) => colors.magenta(g.substr(1)))
            ) +
            '] ')
        ) +
        msg;
    },

    /**
     * @param {string} target
     * @returns {string}
     */
    _buildTarget(target) {
        return (this._scope && (this._scope + path.sep)) + target;
    },

    /**
     * @param {string} level
     * @returns {boolean}
     */
    _isLogLevelEnabled(level) {
        return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this._options.logLevel);
    },

    /**
     * Базовый метод для логгирования.
     * @param {string} msg
     * @param {string} [scope]
     * @param {string} [action]
     */
    log(msg, scope, action) {
        if (this._enabled && this._isLogLevelEnabled('info')) {
            const message = this._buildMessage(msg, scope, action);
            console.log(message);
        }
    },

    /**
     * @param {string} msg
     * @param {string} [scope]
     * @param {string} [action]
     */
    warn(msg, scope, action) {
        if (this._enabled && !this._options.hideWarnings && this._isLogLevelEnabled('warn')) {
            const message = this._buildMessage(msg, scope, action);

            console.warn(message);
        }
    },

    /**
     * @param {string} msg
     * @param {string} [scope]
     * @param {string} [action]
     */
    error(msg, scope, action) {
        if (this._enabled && this._isLogLevelEnabled('error')) {
            const message = this._buildMessage(msg, scope, action);
            console.error(message);
        }
    },

    /**
     * Оформляет запись в лог, как действие.
     * @param {string} action
     * @param {string} target
     * @param {string} [additionalInfo]
     */
    logAction(action, target, additionalInfo) {
        additionalInfo = additionalInfo ? colors.gray(additionalInfo) : '';
        action = action ? '[' + colors.green(action) + ']' : '';

        this.log(additionalInfo, this._buildTarget(target), action);
    },

    /**
     * Выводит варнинг.
     * @param {string} action
     * @param {string} target
     * @param {string} additionalInfo
     */
    logWarningAction(action, target, additionalInfo) {
        action = action ? '[' + colors.yellow(action) + ']' : '';

        this.warn(additionalInfo, this._buildTarget(target), action);
    },

    /**
     * Выводит ошибку.
     * @param {string} action
     * @param {string} target
     * @param {string} [additionalInfo]
     */
    logErrorAction(action, target, additionalInfo) {
        additionalInfo = additionalInfo ? colors.gray(additionalInfo) : '';
        action = action ? '[' + colors.red(action) + ']' : '';

        this.error(additionalInfo, this._buildTarget(target), action);
    },

    /**
     * @param {String} target
     * @param {String} deprecatedTech
     * @param {String} thisPackage
     * @param {String} newTech
     * @param {String} newPackage
     * @param {String} [desc]
     */
    logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, desc) {
        this.logWarningAction('deprecated',
            target,
            'Tech ' + colors.bold(thisPackage + '/techs/' + deprecatedTech) + ' is deprecated.' +
            (newTech && newPackage ?
                ' ' +
                (newPackage === thisPackage ?
                    'Use ' :
                    'Install package ' + colors.bold(newPackage) + ' and use '
                ) +
                'tech ' + colors.bold(newPackage + '/techs/' + newTech) + ' instead.' :
                ''
            ) +
            (desc || '')
        );
    },

    /**
     * @param {String} target
     * @param {String} thisPackage
     * @param {String} tech
     * @param {String} deprecatedOption
     * @param {String} newOption
     * @param {String} desc
     */
    logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, desc) {
        this.logWarningAction('deprecated',
            target,
            'Option ' + colors.bold(deprecatedOption) + ' of ' + colors.bold(thisPackage + '/techs/' + tech) +
            ' is deprecated.' +
            (newOption ? ' Use option ' + colors.bold(newOption) + ' instead.' : '') +
            (desc || '')
        );
    },

    /**
     * Выводит сообщение isValid
     *  (используется технологиями для показа сообщения о том, что таргет не нужно пересобирать).
     * @param {String} target
     * @param {String} [tech]
     */
    isValid(target, tech) {
        this.logAction('isValid', target, tech);
    },

    /**
     * Выводит сообщение clean (используется технологиями для показа сообщения о том, что таргет удален).
     * @param {String} target
     */
    logClean(target) {
        this.logAction('clean', target);
    },

    /**
     * Активирует/деактивирует логгер.
     * С помощью этого метода можно отключить логгирование.
     * @param {Boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
    },

    /**
     * Возвращает активность логгера.
     * @returns {Boolean}
     */
    isEnabled() {
        return this._enabled;
    },

    hideWarnings() {
        this._options.hideWarnings = true;
    },

    showWarnings() {
        this._options.hideWarnings = false;
    },

    getLogLevel() {
        return this._options.logLevel;
    },

    setLogLevel(level) {
        if (LOG_LEVELS.indexOf(level) === -1) {
            throw Error(`Unsupported log level "${level}". Use info, warn or error.`);
        }

        this._options.logLevel = level;
    },

    /**
     * Возвращает новый логгер на основе scope текущего (складывая scope'ы).
     * @param {String} scope
     * @returns {Logger}
     */
    subLogger(scope) {
        const res = new Logger(
            this._scope + (scope.charAt(0) === ':' ? scope : (this._scope && path.sep) + scope),
            this._options
        );
        res.setEnabled(this._enabled);
        return res;
    }
});

/**
 * Добавляет ведущие нули.
 * @param {String} s
 * @param {Number} l
 * @returns {String}
 * @private
 */
function zeros(s, l) {
    s = '' + s;
    while (s.length < l) {
        s = '0' + s;
    }
    return s;
}
