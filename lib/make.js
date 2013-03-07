var Vow = require('vow'),
    Node = require('./node'),
    Level = require('./level'),
    path = require('path'),
    Logger = require('./logger'),
    colors = require('colors');

function MakePlatform() {
    this.nodes = [];
}

MakePlatform.prototype.init = function(cdir) {
    var d, makeFile,
        _this = this;
    this._logger = new Logger(path.basename(cdir));
    makeFile = require(cdir + '/.bem/altmake');
    var env = makeFile.getEnv ? makeFile.getEnv() : {},
        targets = makeFile.getTargets ? makeFile.getTargets() : {};
    d = new Date();
    this.nodes = makeFile.getNodes().map(function(p) {
        var node = new Node(p, cdir + '/' + p, path.basename(p), makeFile.getTechs(), '/tmp');
        node.setLogger(_this._logger.subLogger(p));
        node.setEnv(env);
        function collectTargets(name) {
            var nodeTargets = targets[name],
                targetsToBuild = [];
            nodeTargets && nodeTargets.forEach(function(target) {
                if (target.charAt(0) == '*') {
                    targetsToBuild = targetsToBuild.concat(collectTargets(target));
                } else {
                    targetsToBuild.push(target);
                }
            });
            return targetsToBuild;
        }
        if (targets[node.path]) {
            node.setTargetsToBuild(collectTargets(node.path));
        }
        return node;
    });
    return Vow.all(this.nodes.map(function(n) {
        return n.loadTechs();
    })).then((function() {
        _this._logger.log('init techs - ' + colors.red(((new Date) - d) + 'ms'));
    }));
};

MakePlatform.prototype.build = function(target) {
    var startTime = new Date(),
        targetFile = null,
        nodesToBuild = this.nodes;
    if (target) {
        target = target.replace(/^\/+|\/+$/g,'');
        var lt = target.length;
        nodesToBuild = nodesToBuild.filter(function(node) {
            var path = node.path;
            if (target.indexOf(path) != -1) {
                if (lt != path.length) {
                    if (target.charAt(path.length) == '/') {
                        targetFile = target.substr(path.length + 1);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            } else {
                return false;
            }
        });
    }
    var promise = Vow.promise(),
        _this = this;
    this.buildCache = {};
    this._logger.log('build started');
    Vow.all(nodesToBuild.map(function(n) {
        return n.build(targetFile, _this.buildCache);
    })).then((function() {
        _this._logger.log('build finished - ' + colors.red((new Date() - startTime) + 'ms'));
        return promise.fulfill();
    }), function(err) {
        return promise.reject(err);
    });
    return promise;
};

module.exports = MakePlatform;
