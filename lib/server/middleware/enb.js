'use strict';

const path = require('path');

const make = require('../../api/make');

const cwd = process.cwd();

module.exports = options => {
    return (req, res, next) => {
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
        .then(() => {
            const endTime = new Date();

            console.log(`----- ${path.normalize(pathname)} ${endTime - startTime}ms`);

            next();
        })
        .fail(err => {
            next(err);
        });
    };
};
