/**
 * Deprecate
 * ==========
 *
 * Utility for deprecating outdated modules\methods
 * Outputs messages using ENB format, takes in account warnings disabling
 * Adds to output information about file (path to file, line and column) where deprecated code was invoked.
 */

var util = require('util');
var _ = require('lodash');
var stackTrace = require('stack-trace');
var colorize = require('../ui/colorize');
var Logger = require('../logger');

var logger = new Logger();
var delayedMessages = [];
var isInitialized = false;

/**
 * Initializes deprecate.
 * Before initialization messages are delayed and queued.
 * After initialization messages are logged in order they were added to queue.
 * @param {Object} [opts]
 * @param {boolean} [opts.hideWarnings] Hides deprecation warnings
 */
function initialize(opts) {
    opts = opts || {};

    if (opts.hideWarnings) {
        logger.hideWarnings();
    }
    printDelayedMessages();

    isInitialized = true;
}

/**
 * Logs deprecate message
 * @param {Object} messageInfo
 * @param {String} messageInfo.module          Module containing deprecated code
 * @param {String} [messageInfo.rmSince]         Version since deprecated code will be removed
 * @param {String} [messageInfo.method]        Deprecated method
 * @param {String} [messageInfo.replaceModule] Recommended replacement module
 * @param {String} [messageInfo.replaceMethod] Recommended replacement method
 */
function deprecate(messageInfo) {
    checkMessageInfo(messageInfo);

    return isInitialized ?
        printMessage(messageInfo, getInvocationLine()) :
        delayedMessages.push({
            messageInfo: messageInfo,
            invocationLine: getInvocationLine()
        });
}

function checkMessageInfo(messageInfo) {
    if (!messageInfo.module) {
        throw new Error('Missing required field: module');
    }
}

function printDelayedMessages() {
    delayedMessages.forEach(function (delayed) {
        printMessage(delayed.messageInfo, delayed.invocationLine);
    });
    delayedMessages = [];
}

function printMessage(messageInfo, invocationLine) {
    var msg = [
        buildDeprecateSentence(messageInfo.method, messageInfo.module),
        buildRemoveVersionSentence(messageInfo.rmSince),
        buildReplacementSentence(messageInfo.replaceMethod, messageInfo.replaceModule)
    ].join(' ');

    logger.logWarningAction('deprecate', invocationLine, msg);
}

function buildDeprecateSentence(method, module) {
    return (method ? colorize.yellow(method) + ' in ' : '') + colorize.yellow(module) + ' is deprecated.';
}

function buildRemoveVersionSentence(since) {
    return since ?
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
        !/^[\/.]|([A-Z]:)/.test(frame.getFileName());
}

deprecate.initialize = initialize;
module.exports = deprecate;
