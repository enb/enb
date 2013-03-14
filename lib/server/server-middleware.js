var MakePlatform = require('../make'),
    TargetNotFoundError = require('../errors/target-not-found-error'),
    fs = require('fs'),
    Logger = require('../logger');

module.exports.createMiddleware = function(options) {
    var cacheLoaded = false,
        cacheStorage,
        cacheSaveTimer;
    return function(req, res, next) {
        var makePlatform = new MakePlatform(),
            targetPath = req.path.replace(/^\/+|\/$/g, '');
        makePlatform.init(options.cdir).then(function() {
            if (!cacheLoaded) {
                makePlatform.loadCache();
                cacheLoaded = true;
                cacheStorage = makePlatform.getCacheStorage();
            } else {
                makePlatform.setCacheStorage(cacheStorage);
            }
            var dt = new Date(), logger = new Logger(targetPath + ' - ');
            makePlatform.setLogger(logger);
            return makePlatform.buildTargets([targetPath]).then(function() {
                try {
                    makePlatform.destruct();
                    res.end(fs.readFileSync(options.cdir + '/' + targetPath, 'utf8'));
                    console.log('----- ' + targetPath + ' ' + (new Date() - dt) + 'ms');
                    if (cacheSaveTimer) {
                        clearTimeout(cacheSaveTimer);
                    }
                    cacheSaveTimer = setTimeout(function() {
                        cacheSaveTimer = null;
                        cacheStorage.save();
                    }, 500);
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