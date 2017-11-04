'use strict'

const path = require('path');
const cwd = process.cwd();

/**
 * Format a CallSite file location to a string.
 *
 * @param {Object} callSite
 * @returns {string}
 */
module.exports = function (callSite) {
    let fileName;
    let fileLocation = '';

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
        fileLocation += path.relative(cwd, fileName);

        const lineNumber = callSite.getLineNumber();
        if (lineNumber != null) {
            fileLocation += ':' + lineNumber;

            const columnNumber = callSite.getColumnNumber();
            if (columnNumber) {
                fileLocation += ':' + columnNumber;
            }
        }
    }

    return fileLocation || 'unknown source';
};
