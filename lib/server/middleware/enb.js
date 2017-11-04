'use strict';

var path = require('path');
var cwd = process.cwd();
var make = require('../../api/make');

module.exports = function (options) {
    return function (req, res, next) {
        options = options || {};

        var startTime = new Date();
        var root = options.root || cwd;
        var pathname = req._parsedUrl.pathname;
        var filename = path.join(root, pathname);
        var target = path.relative(root, filename);
        var targets = target ? [target] : [];

        make(targets, {
                dir: root,
                mode: options.mode,
                cache: !options.hasOwnProperty('cache') || options.cache,
                hideWarnings: options.hideWarnings,
                logLevel: options.logLevel,
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
