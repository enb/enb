'use strict';

const vow = require('vow');

module.exports = (module, args, cb) => {
    return vow.invoke(() => require(module).apply(null, args))
        .done(cb.bind(null, null), cb);
}
