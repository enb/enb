var path = require('path');
var fs = require('fs');

/**
 * Возвращает информацию о файле по полному пути.
 * @param {String} fullname
 * @returns {{name: *, fullname: *, suffix: string, mtime: null}}
 * @private
 */
function getFileInfo(fullname) {
    var filename = path.basename(fullname),
        mtime = null;

    if (fs.existsSync(fullname)) {
        mtime = fs.statSync(fullname).mtime.getTime();
    }

    return {
        name: filename,
        fullname: fullname,
        suffix: filename.split('.').slice(1).join('.'),
        mtime: mtime
    };
}

module.exports = getFileInfo;
