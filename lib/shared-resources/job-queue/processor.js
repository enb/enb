var vow = require('vow');

module.exports = function (module, args, cb) {
    return vow.invoke(function () {
            return require(module).apply(null, args);
        })
        .done(cb.bind(null, null), cb);
};
