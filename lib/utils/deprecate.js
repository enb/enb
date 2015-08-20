/**
 * Deprecate
 * ==========
 *
 * Утилита для объявления модулей и\или методов устаревшими.
 * Выводит сообщения используя принятый в ENB формат, учитывает включение\отключение предупреждений.
 * В вывод добавляет информацию о файле, из которого был вызван устаревший код.
 */

var util = require('util');
var os = require('os');
var _ = require('lodash');
var stackTrace = require('stack-trace');
var colorize = require('../ui/colorize');
var Logger = require('../logger');

var logger = new Logger();
var delayedMessages = [];
var isInitialized = false;

/**
 * Инициализирует утилиту. До инициализации сообщения отправляются в очередь.
 * После инициализации сообщения выводятся в том же порядке, в котором попали в очередь.
 * @param {Object} [opts]
 * @param {boolean} [opts.hideWarnings] Показывает, нужно ли скрыть предупреждения.
 */
exports.initialize = function (opts) {
    opts = opts || {};

    if (opts.hideWarnings) {
        logger.hideWarnings();
    }
    printDelayedMessages();

    isInitialized = true;
};

/**
 * Выводит сообщение об устаревшем коде
 * @param {Object} messageInfo
 * @param {String} messageInfo.module          Модуль, содержащий устаревший код
 * @param {String} [messageInfo.since]           Версия, с которой устаревший код будет удалён
 * @param {String} [messageInfo.method]        Метод, объявленный устаревшим
 * @param {String} [messageInfo.replaceModule] Модуль рекомендуемый в качестве замены
 * @param {String} [messageInfo.replaceMethod] Метод, рекомендуемый в качестве замены
 */
exports.deprecate = function (messageInfo) {
    checkMessageInfo(messageInfo);

    return isInitialized ?
        printMessage(messageInfo) :
        delayedMessages.push(messageInfo);
};

function checkMessageInfo(messageInfo) {
    if (!messageInfo.module) {
        throw new Error('Missing required field: module');
    }
}

function printDelayedMessages() {
    delayedMessages.forEach(printMessage);
    delayedMessages = [];
}

function printMessage(messageInfo) {
    var msg = [
        buildDeprecateSentence(messageInfo.method, messageInfo.module),
        buildRemoveVersionSentence(messageInfo.since),
        buildReplacementSentence(messageInfo.replaceMethod, messageInfo.replaceModule)
    ].join(' ');

    logger.logWarningAction('deprecate', getInvocationLine(), msg);
}

function buildDeprecateSentence(method, module) {
    return (method ? colorize.yellow(method) + ' in ' : '') + colorize.yellow(module) + ' is deprecated.';
}

function buildRemoveVersionSentence(since) {
    return since && since.length ?
        util.format('It will be removed since %s.', colorize.yellow(since)) :
        '';
}

function buildReplacementSentence(replaceMethod, replaceModule) {
    if (!replaceMethod && !replaceModule) {
        return '';
    }

    var msg = replaceMethod && replaceModule ?
        util.format('%s in %s', colorize.yellow(replaceMethod), colorize.yellow(replaceModule)) :
        colorize.yellow(replaceMethod || replaceModule);

    return 'Please use ' + msg;
}

function getInvocationLine() {
    var frame = findDeprecatedInvocationFrame();
    var lineColInfo = util.format(colorize.magenta('(%d.%d)'), frame.getLineNumber(), frame.getColumnNumber());

    return frame.getFileName() + lineColInfo;
}

function findDeprecatedInvocationFrame() {
    return stackTrace.get()
        .filter(_.negate(isCurrentModule))
        .filter(_.negate(isNode))[1]; //In filtered result 1st entry - frame with deprecated module/method
}

function isCurrentModule(frame) {
    return frame.getFileName() === __filename;
}

function isNode(frame) {
    return frame.isNative() ||
        platformNodeFileRegexp().test(frame.getFileName());
}

function platformNodeFileRegexp() {
    return (/^win/i).test(os.type()) ?
        /^(?!\w{1}:)/ :
        /^[^\/.]/;
}
