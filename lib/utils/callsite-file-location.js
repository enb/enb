'use strict'

/**
 * Format a CallSite file location to a string.
 *
 * @param {Object} callSite
 * @returns {string}
 */
module.exports = function (callSite) {
    var fileName;
    var fileLocation = '';

    if (callSite.isNative()) {
        fileLocation = 'native';
    } else if (callSite.isEval()) {
        fileName = callSite.getScriptNameOrSourceURL();

        if (!fileName) {
            fileLocation = callSite.getEvalOrigin();
        }
    } else {
        fileName = callSite.getFileName();
    }

    if (fileName) {
        fileLocation += fileName;

        var lineNumber = callSite.getLineNumber();
        if (lineNumber != null) {
            fileLocation += ':' + lineNumber;

            var columnNumber = callSite.getColumnNumber();
            if (columnNumber) {
                fileLocation += ':' + columnNumber;
            }
        }
    }

    return fileLocation || 'unknown source';
};
