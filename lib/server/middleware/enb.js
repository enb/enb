var path = require('path'),
    cwd = process.cwd(),
    make = require('../../api/make');

/**
 * @param {Object} options
 * @param {String} [options.root=process.cwd()] - Корневая директория проекта.
 * @param {String} [options.mode='development'] - Режим сборки
 * @param {Boolean} [options.log=true] - Логгировать в консоль процесс сборки.
 * @returns {Function}
 */
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
                log: options.log,
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
