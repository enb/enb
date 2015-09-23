var deprecate = require('../utils/deprecate');

deprecate({
    module: 'require-or-eval',
    replaceModule: 'enb-require-or-eval'
});

module.exports = require('enb-require-or-eval');
