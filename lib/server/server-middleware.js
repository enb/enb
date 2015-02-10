/**
 * server-middleware
 * =================
 *
 * Инструментарий для подключения ENB к express-приложению.
 */
var MakePlatform = require('../make');
var TargetNotFoundError = require('../errors/target-not-found-error');
var Logger = require('../logger');
var mime = require('mime');
var send = require('send');
var path = require('path');

/**
 * Заменяет слэши на обратные, если используется ОС Windows
 * @param {String} filename
 * @returns {String}
 */
function fixPath(filename) {
    return path.sep === '/' ? filename : filename.replace(/\//g, '\\');
}

/**
 * @param {Object} options
 * @param {String} options.cdir Корневая директория проекта.
 * @param {Boolean} options.noLog Не логгировать в консоль процесс сборки.
 * @returns {Function}
 */
module.exports.createMiddleware = function (options) {
    var builder = this.createBuilder(options);
    return function (req, res, next) {
        var dt = new Date();
        var pathname = req._parsedUrl.pathname;
        builder(pathname).then(function (filename) {
            try {
                var mimeType = mime.lookup(filename);
                var mimeCharset = mimeType === 'application/javascript' ?
                    'UTF-8' :
                    mime.charsets.lookup(mimeType, null);

                res.setHeader('Content-Type', mimeType + (mimeCharset ? '; charset=' + mimeCharset : ''));
                send(req, filename).pipe(res);

                console.log('----- ' + fixPath(pathname) + ' ' + (new Date() - dt) + 'ms');
            } catch (err) {
                next(err);
            }
        }, function (err) {
            if (err instanceof TargetNotFoundError) {
                next();
            } else {
                next(err);
            }
        });
    };
};

/**
 * @param {Object} options
 * @param {String} options.cdir Корневая директория проекта.
 * @param {Boolean} options.noLog Не логгировать в консоль процесс сборки.
 * @returns {Function}
 */
module.exports.createBuilder = function (options) {
    options = options || {};
    options.cdir = options.cdir || process.cwd();
    return function (pathname) {
        var makePlatform = new MakePlatform();
        var targetPath = pathname.replace(/^\/+|\/$/g, '');
        return makePlatform.init(options.cdir, options.mode, options.config).then(function () {
            if (options.cache) {
                makePlatform.loadCache();
            }

            targetPath = fixPath(targetPath);

            var logger = new Logger(targetPath + ' - ');
            if (options.noLog) {
                logger.setEnabled(false);
            }
            makePlatform.setLogger(logger);

            return makePlatform.buildTargets([targetPath]).then(function () {
                makePlatform.saveCache();
                makePlatform.destruct();
                return path.join(options.cdir, targetPath);
            });
        });
    };
};
