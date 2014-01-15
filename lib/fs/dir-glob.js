/**
 * dir-glob
 * ========
 *
 * Утилита для выбора директорий по маске. Например, 'pages/*' -> ['pages/index', 'pages/login'].
 */
var fs = require('fs');
module.exports = {
    /**
     * Выбирает директории по маске.
     * @param {String} path
     * @returns {String[]}
     */
    globSync: function (path) {
        path = path.replace(/\/$/, '').replace(/^\//, '');
        var pathBits = path.split('/');
        var matched = [''];
        var pathBit;
        var matchedItem;
        function filterDirectories(dirName) {
            if (dirName.charAt(0) === '.' || dirName.charAt(0) === '~') {
                return false;
            }
            if (dirName.match(expr)) {
                var fullPath = matchedItem + '/' + dirName;
                return fs.statSync(fullPath).isDirectory();
            } else {
                return false;
            }
        }
        function buildPath(dirName) {
            return matchedItem + '/' + dirName;
        }
        var newMatched;
        while (!!(pathBit = pathBits.shift())) {
            newMatched = [];
            for (var i = 0, l = matched.length; i < l; i++) {
                matchedItem = matched[i];
                if (~pathBit.indexOf('*')) {
                    var expr = new RegExp(pathBit.split('*').map(escapeRegex).join('.*'));
                    newMatched = newMatched.concat(
                        fs.readdirSync(matchedItem || '/')
                            .filter(filterDirectories)
                            .map(buildPath)
                    );
                } else {
                    matchedItem += '/' + pathBit;
                    if (fs.existsSync(matchedItem)) {
                        newMatched.push(matchedItem);
                    }
                }
            }
            matched = newMatched;
        }
        return matched;
    }
};

function escapeRegex(value) {
    return value.replace(/[\-\[\]{}\(\)\*\+\?\.,\\\^\$\|#]/g, '\\$&');
}
