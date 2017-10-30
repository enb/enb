/**
 * Logger
 * ======
 */
var colors = require('./ui/colorize'),
    inherit = require('inherit'),
    path = require('path'),

    /**
     * Логгер. В данной реализации — обертка над console.log.
     * Выводит в консоль процесс сборки проекта.
     * @name Logger
     */
    Logger = module.exports = inherit(/** @lends Logger.prototype */ {

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
         * @param {string} msg
         * @param {string} [scope]
         * @param {string} [action]
         * @returns {string}
         */
        _buildMessage: function (msg, scope, action) {
            var dt = new Date();

            scope = scope || this._scope;
            action = action || '';

            return colors.gray(
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
            msg;
        },

        /**
         * @param {string} action
         * @param {string} target
         * @param {string} [additionalInfo]
         */
        _buildActionMessage: function (action, target, additionalInfo) {
            return this._buildMessage(
                additionalInfo,
                (this._scope && (this._scope + path.sep)) + target,
                '[' + action + ']'
            );
        },

        /**
         * Базовый метод для логгирования.
         * @param {string} msg
         * @param {string} [scope]
         * @param {string} [action]
         */
        log: function (msg, scope, action) {
            if (this._enabled) {
                var message = this._buildMessage(msg, scope, action);
                console.log(message);
            }
        },

        /**
         * @param {string} msg
         * @param {string} [scope]
         * @param {string} [action]
         */
        warn: function (msg, scope, action) {
            if (this._enabled && !this._options.hideWarnings) {
                var message = this._buildMessage(msg, scope, action);

                console.warn(message);
            }
        },

        /**
         * @param {string} msg
         * @param {string} [scope]
         * @param {string} [action]
         */
        error: function (msg, scope, action) {
            if (this._enabled) {
                var message = this._buildMessage(msg, scope, action);
                console.error(message);
            }
        },

        /**
         * Оформляет запись в лог, как действие.
         * @param {string} action
         * @param {string} target
         * @param {string} [additionalInfo]
         */
        logAction: function (action, target, additionalInfo) {
            additionalInfo = additionalInfo ? colors.gray(additionalInfo) : '';
            action = action ? colors.green(action) : '';

            var message = this._buildActionMessage(action, target, additionalInfo);

            this.log(message);
        },

        /**
         * Выводит варнинг.
         * @param {string} action
         * @param {string} target
         * @param {string} additionalInfo
         */
        logWarningAction: function (action, target, additionalInfo) {
            action = action ? colors.yellow(action) : '';

            var message = this._buildActionMessage(action, target, additionalInfo);

            this.warn(message);
        },

        /**
         * Выводит ошибку.
         * @param {string} action
         * @param {string} target
         * @param {string} [additionalInfo]
         */
        logErrorAction: function (action, target, additionalInfo) {
            additionalInfo = additionalInfo ? colors.gray(additionalInfo) : '';
            action = action ? colors.red(action) : '';

            var message = this._buildActionMessage(action, target, additionalInfo);

            this.error(message);
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
         *
         * @param {String} target
         * @param {String} thisPackage
         * @param {String} tech
         * @param {String} deprecatedOption
         * @param {String} newOption
         * @param desc
         */
        logOptionIsDeprecated: function (target, thisPackage, tech, deprecatedOption, newOption, desc) {
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
