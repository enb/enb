var MakePlatform = require('../make'),
    TargetNotFoundError = require('../errors/target-not-found-error'),
    fs = require('fs'),
    Logger = require('../logger'),
    mime = require('mime');

module.exports.createMiddleware = function(options) {
    return function(req, res, next) {
        var makePlatform = new MakePlatform(),
            targetPath = req.path.replace(/^\/+|\/$/g, '');
        makePlatform.init(options.cdir).then(function() {
            makePlatform.loadCache();
            var dt = new Date(), logger = new Logger(targetPath + ' - ');
            makePlatform.setLogger(logger);
            return makePlatform.buildTargets([targetPath]).then(function() {
                try {
                    var mimeType = mime.lookup(targetPath),
                        mimeCharset = mimeType === 'application/javascript' ? 'UTF-8' : mime.charsets.lookup(mimeType, null);
                    res.set({ 'Content-Type': mimeType + (mimeCharset ? '; charset=' + mimeCharset : '') });
                    res.sendfile(options.cdir + '/' + targetPath);
                    console.log('----- ' + targetPath + ' ' + (new Date() - dt) + 'ms');
                    makePlatform.saveCache();
                    makePlatform.destruct();
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
        });
    }
};