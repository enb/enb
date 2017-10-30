var clearRequire = require('clear-require');

var deprecate = require('../utils/deprecate');

deprecate({
    module: 'enb/lib/fs/drop-require-cache',
    replaceModule: 'clear-require'
});

module.exports = function (require, path) {
    clearRequire(path);
};
