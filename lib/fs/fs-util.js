'use strict';

var path = require('path'),
    fs = require('fs');

/**
 * @param {String} fullname
 * @returns {{name: *, fullname: *, suffix: string, mtime: null}}
 * @private
 */
exports.getFileInfo = function (fullname) {
    var filename = path.basename(fullname),
        stat = null;

    try {
        stat = fs.statSync(fullname);
    } catch (e) {}

    return {
        name: filename,
        fullname: fullname,
        suffix: filename.split('.').slice(1).join('.'),
        mtime: stat && stat.mtime.getTime(),
        isDirectory: stat && stat.isDirectory()
    };
};

exports.mkHash = function (path) {
    return path.replace(/[\/\\: ]/g, '_');
};
