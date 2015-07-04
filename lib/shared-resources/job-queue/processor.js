module.exports = function (module, args, cb) {
    var res = null;
    var err = null;
    try {
        res = require(module).apply(null, args);
    } catch (e) {
        err = e;
    }

    cb(err, res);
};
