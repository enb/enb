var path = require('path'),
    cwd = process.cwd(),
    make = require('../../api/make');

module.exports = function (options) {
    return function (req, res, next) {
        options = options || {};

        var startTime = new Date(),
            root = options.root || cwd,
            pathname = req._parsedUrl.pathname,
            filename = path.join(root, pathname),
            target = path.relative(root, filename),
            targets = target ? [target] : [];

        make(targets, {
                dir: root,
                mode: options.mode,
                cache: true,
                strict: false
            })
            .then(function () {
                var endTime = new Date();

                console.log('----- ' + path.normalize(pathname) + ' ' + (endTime - startTime) + 'ms');

                next();
            })
            .fail(function (err) {
                next(err);
            });
    };
};
