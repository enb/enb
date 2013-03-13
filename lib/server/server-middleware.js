var MakePlatform = require('../make'),
    TargetNotFoundError = require('../errors/target-not-found-error'),
    fs = require('fs'),
    Logger = require('../logger');

module.exports.createMiddleware = function(options) {
    return function(req, res, next) {
        var makePlatform = new MakePlatform(),
            targetPath = req.path.replace(/^\/+|\/$/g, '');
        makePlatform.init(options.cdir).then(function() {
            var dt = new Date(), logger = new Logger(targetPath + ' - ');
            makePlatform.setLogger(logger);
            return makePlatform.buildTargets([targetPath]).then(function() {
                try {
                    makePlatform.destruct();
                    res.end(fs.readFileSync(options.cdir + '/' + targetPath, 'utf8'));
                    console.log('----- ' + targetPath + ' ' + (new Date() - dt) + 'ms');
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