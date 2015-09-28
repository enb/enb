var deprecate = require('../utils/deprecate');

deprecate({
    module: 'async-require',
    replaceModule: 'enb-async-require'
});

module.exports = require('enb-async-require');
