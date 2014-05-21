/**
 * Logger
 * ======
 */
var colors = require('./ui/colorize');
var inherit = require('inherit');

/**
 * Логгер. В данной реализации — обертка над console.log.
 * Выводит в консоль процесс сборки проекта.
 * @name Logger
 */
var Logger = module.exports = inherit( /** @lends Logger.prototype */ {

    /**
     * Конструктор.
     * На основе одного логгера можно создать вложенный логгер с помощью аргумента scope.
     * Если указан scope, то scope будет выводиться при логгировании.
     * @param {String} scope
     * @param {Object} options
     * @private
     */
    __constructor: function (scope, options) {
        this._scope = scope || '';
        this._enabled = true;
        this._options = options || {};
    },

    /**
     * Базовый метод для логгирования.
     * @param {String} msg
     * @param {String} [scope]
     * @param {String} [action]
     */
    log: function (msg, scope, action) {
        scope = scope || this._scope;
        action = action || '';
        var dt = new Date();
        if (this._enabled) {
            console.log(
                colors.grey(
                    zeros(dt.getHours(), 2) + ':' +
                    zeros(dt.getMinutes(), 2) + ':' +
                    zeros(dt.getSeconds(), 2) + '.' +
                    zeros(dt.getMilliseconds(), 3) + ' - '
                ) +
                (action && action + ' ') +
                (scope && ('[' +
                    colors.blue(
                        scope.replace(/(:.+)$/, function (s, g) {
                            return colors.magenta(g.substr(1));
                        })
                    ) +
                    '] ')
                ) +
                msg
            );
        }
    },

    /**
     * Оформляет запись в лог, как действие.
     * @param {String} action
     * @param {String} target
     * @param {String} [additionalInfo]
     */
    logAction: function (action, target, additionalInfo) {
        this.log(
            (additionalInfo ? colors.grey(additionalInfo) : ''),
            (this._scope && (this._scope + '/')) + target,
            '[' + colors.green(action) + ']'
        );
    },

    /**
     * Выводит варнинг.
     * @param {String} action
     * @param {String} target
     * @param {String} msg
     */
    logWarningAction: function (action, target, msg) {
        if (!this._options.hideWarnings) {
            this.log(
                msg,
                (this._scope && (this._scope + '/')) + target,
                '[' + colors.yellow(action) + ']'
            );
        }
    },

    /**
     * @param {String} target
     * @param {String} deprecatedTech
     * @param {String} thisPackage
     * @param {String} newTech
     * @param {String} newPackage
     * @param {String} [desc]
     */
    logTechIsDeprecated: function (target, deprecatedTech, thisPackage, newTech, newPackage, desc) {
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
     * Выводит ошибку.
     * @param {String} action
     * @param {String} target
     * @param {String} [additionalInfo]
     */
    logErrorAction: function (action, target, additionalInfo) {
        this.log(
            (additionalInfo ? colors.grey(additionalInfo) : ''),
            (this._scope && (this._scope + '/')) + target,
            '[' + colors.red(action) + ']'
        );
    },

    /**
     * Выводит сообщение isValid
     *  (используется технологиями для показа сообщения о том, что таргет не нужно пересобирать).
     * @param {String} target
     * @param {String} [tech]
     */
    isValid: function (target, tech) {
        this.logAction('isValid', target, tech);
    },

    /**
     * Выводит сообщение clean (используется технологиями для показа сообщения о том, что таргет удален).
     * @param {String} target
     */
    logClean: function (target) {
        this.logAction('clean', target);
    },

    /**
     * Активирует/деактивирует логгер.
     * С помощью этого метода можно отключить логгирование.
     * @param {Boolean} enabled
     */
    setEnabled: function (enabled) {
        this._enabled = enabled;
    },

    /**
     * Возвращает активность логгера.
     * @returns {Boolean}
     */
    isEnabled: function () {
        return this._enabled;
    },

    hideWarnings: function () {
        this._options.hideWarnings = true;
    },

    showWarnings: function () {
        this._options.hideWarnings = false;
    },

    /**
     * Возвращает новый логгер на основе scope текущего (складывая scope'ы).
     * @param {String} scope
     * @returns {Logger}
     */
    subLogger: function (scope) {
        var res = new Logger(
            this._scope + (scope.charAt(0) === ':' ? scope : (this._scope && '/') + scope),
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
