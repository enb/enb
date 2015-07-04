module.exports = function (module, args, cb) {
    var res = {};
    try {
        res.val = require(module).apply(null, args);
    } catch (e) {
        res.err = e;
    }

    cb(res);
};
