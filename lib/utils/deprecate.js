var util = require('util');
var _ = require('lodash');
var stackTrace = require('stack-trace');
var colorize = require('../ui/colorize');
var Logger = require('../logger');

var logger = new Logger();

var delayedMessages = [];
var isInitialized = false;

exports.initialize = function (mustShowWarnings) {
    isInitialized = true;

    if (mustShowWarnings) {
        logger.showWarnings();
    } else {
        logger.hideWarnings();
    }

    printDelayedMessages();
};

exports.deprecate = function (message) {
    var error = checkMessage(message);

    if (error) {
        throw error;
    }

    if (!isInitialized) {
        delayedMessages.push(message);
    } else {
        printMessage(message);
    }
};

function checkMessage(message) {
    if (typeof message.module !== 'string') {
        return new Error('Please provide deprecated module name in message.module');
    }

    if (typeof message.since !== 'string') {
        return new Error('Please provide remove version in message.since');
    }

    return null;
}

function printDelayedMessages() {
    delayedMessages.forEach(printMessage);
    delayedMessages = [];
}

function printMessage(message) {
    var method = message.method;
    var module = message.module;
    var since = message.since;
    var replaceMethod = replaceMethod;
    var replaceModule = replaceModule;
    var msg = [
        buildDeprecateSentence(method, module),
        buildRemoveVersionSentence(since),
        buildReplacementSentence(replaceMethod, replaceModule)
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
    var message = '';

    if (!replaceMethod && !replaceModule) {
        return message;
    }

    message = 'Please use ';

    if (replaceMethod && replaceModule) {
        return message + util.format('%s in %s', colorize.yellow(replaceMethod), colorize.yellow(replaceModule));
    }

    if (replaceMethod) {
        return message + colorize.yellow(replaceMethod);
    }

    if (replaceModule) {
        return message + colorize.yellow(replaceModule);
    }
}

function getInvocationLine() {
    var frame = findDeprecatedInvocationFrame();
    var lineColInfo = util.format(colorize.magenta('(%d.%d)'), frame.getLineNumber(), frame.getColumnNumber());

    return frame.getFileName() + lineColInfo;
}

function findDeprecatedInvocationFrame() {
    //splice(1) - removing deprecated entry from trace
    var trace = stackTrace.get().filter(_.negate(isDeprecate)).filter(_.negate(isNode)).splice(1);

    return trace[0];
}

function isDeprecate(frame) {
    return frame.getFileName() === __filename;
}

function isNode(frame) {
    return frame.isNative() || /^[^\/.]/.test(frame.getFileName()) || /^\w{1}:/.test(frame.getFileName());
}
