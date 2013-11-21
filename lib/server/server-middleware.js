/**
 * server-middleware
 * =================
 *
 * Инструментарий для подключения ENB к express-приложению.
 */
var MakePlatform = require('../make'),
    TargetNotFoundError = require('../errors/target-not-found-error'),
    fs = require('graceful-fs'),
    Logger = require('../logger'),
    mime = require('mime');

/**
 * @param {Object} options
 * @param {String} options.cdir Корневая директория проекта.
 * @param {Boolean} options.noLog Не логгировать в консоль процесс сборки.
 * @returns {Function}
 */
module.exports.createMiddleware = function(options) {
    var builder = this.createBuilder(options);
    return function(req, res, next) {
        var dt = new Date();
        builder(req.path).then(function(filename) {
            try {
                var mimeType = mime.lookup(filename);
                var mimeCharset = mimeType === 'application/javascript' ?
                    'UTF-8' :
                    mime.charsets.lookup(mimeType, null);

                res.set({ 'Content-Type': mimeType + (mimeCharset ? '; charset=' + mimeCharset : '') });
                res.sendfile(filename);
                console.log('----- ' + req.path + ' ' + (new Date() - dt) + 'ms');
            } catch (err) {
                next(err);
            }
        }, function(err) {
            if (err instanceof TargetNotFoundError) {
                next();
            } else {
                next(err);
            }
        });
    };
};

module.exports.createBuilder = function(options) {
    options = options || {};
    options.cdir = options.cdir || process.cwd();
    return function(path) {
        var makePlatform = new MakePlatform(),
            targetPath = path.replace(/^\/+|\/$/g, '');
        return makePlatform.init(options.cdir).then(function() {
            makePlatform.loadCache();
            var logger = new Logger(targetPath + ' - ');
            if (options.noLog) {
                logger.setEnabled(false);
            }
            makePlatform.setLogger(logger);
            return makePlatform.buildTargets([targetPath]).then(function() {
                makePlatform.saveCache();
                makePlatform.destruct();
                return options.cdir + '/' + targetPath;
            });
        });
    };
};
