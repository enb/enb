'use strict';

const deprecate = require('../utils/deprecate');

deprecate({
    module: 'enb/lib/fs/async-require',
    replaceModule: 'enb-async-require'
});

module.exports = require('enb-async-require');
