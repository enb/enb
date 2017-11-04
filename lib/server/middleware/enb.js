'use strict';

const path = require('path');
const cwd = process.cwd();
const make = require('../../api/make');

module.exports = function (options) {
    return function (req, res, next) {
        options = options || {};

        const startTime = new Date();
        const root = options.root || cwd;
        const pathname = req._parsedUrl.pathname;
        const filename = path.join(root, pathname);
        const target = path.relative(root, filename);
        const targets = target ? [target] : [];

        make(targets, {
                dir: root,
                mode: options.mode,
                cache: !options.hasOwnProperty('cache') || options.cache,
                hideWarnings: options.hideWarnings,
                logLevel: options.logLevel,
                strict: false
            })
            .then(function () {
                const endTime = new Date();

                console.log(`----- ${path.normalize(pathname)} ${endTime - startTime}ms`);

                next();
            })
            .fail(function (err) {
                next(err);
            });
    };
};
