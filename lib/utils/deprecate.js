var util = require('util');
var os = require('os');
var _ = require('lodash');
var stackTrace = require('stack-trace');
var colorize = require('../ui/colorize');
var Logger = require('../logger');

var logger = new Logger();
var delayedMessages = [];
var isInitialized = true;

exports.initialize = function (opts) {
    isInitialized = true;

    if (opts.showWarnings) {
        logger.showWarnings();
    } else {
        logger.hideWarnings();
    }

    printDelayedMessages();
};

exports.deprecate = function (messageInfo) {
    checkMessageInfo(messageInfo);

    return isInitialized ?
        printMessage(messageInfo) :
        delayedMessages.push(messageInfo);
};

function checkMessageInfo(messageInfo) {
    ['module', 'since'].forEach(function (field) {
        if (!messageInfo[field]) {
            throw new Error('Missing required field ' + field);
        }
    });
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
    return util.format('It will be removed since %s.', colorize.yellow(since));
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
    //splice(1) - removing deprecated entry from trace
    return stackTrace.get()
        .filter(_.negate(isDeprecate))
        .filter(_.negate(isNode))
        .splice(1)[0];
}

function isDeprecate(frame) {
    return frame.getFileName() === __filename;
}

function isNode(frame) {
    return frame.isNative() ||
        platformNodeFileRegexp().test(frame.getFileName());
}

function platformNodeFileRegexp() {
    return (/^win/i).test(os.platform()) ?
        /^(?!\w{1}:)/ :
        /^[^\/.]/;
}
