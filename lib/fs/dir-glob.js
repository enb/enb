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
    globSync: function(path) {
        path = path.replace(/\/$/, '').replace(/^\//, '');
        var pathBits = path.split('/');
        var matched = [''];
        var pathBit;
        while (pathBit = pathBits.shift()) {
            var newMatched = [];
            for (var i = 0, l = matched.length; i < l; i++) {
                var matchedItem = matched[i];
                if (~pathBit.indexOf('*')) {
                    var expr = new RegExp(pathBit.split('*').map(escapeRegex).join('.*'));
                    newMatched = newMatched.concat(
                        fs.readdirSync(matchedItem || '/')
                            .filter(function(dirName) {
                                if (dirName.charAt(0) === '.' || dirName.charAt(0) === '~') return false;
                                //noinspection JSReferencingMutableVariableFromClosure
                                if (dirName.match(expr)) {
                                    //noinspection JSReferencingMutableVariableFromClosure
                                    var fullPath = matchedItem + '/' + dirName;
                                    return fs.statSync(fullPath).isDirectory();
                                } else {
                                    return false;
                                }
                            })
                            .map(function(dirName) {
                                //noinspection JSReferencingMutableVariableFromClosure
                                return matchedItem + '/' + dirName;
                            })
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
    return value.replace(/[\-\[\]{}\(\)\*\+\?\.,\\\^\$\|#]/g, "\\$&");
}
