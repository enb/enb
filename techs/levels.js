/**
 * levels
 * ======
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var Level = require('../lib/levels/level');
var Levels = require('../lib/levels/levels');
var Vow = require('vow');
var VowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');
var path = require('path');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'levels';
    },

    init: function () {
        this.__base.apply(this, arguments);
        this._levelConfig = this.getRequiredOption('levels');
        this._sublevelDirectories = this.getOption('sublevelDirectories', ['blocks']);
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.levels'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var target = this._target;
        var levelList = [];
        var levelsToCache = [];
        var levelsIndex = {};
        var cache = this.node.getNodeCache(target);
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'levels', 'enb-bem-techs');

        for (var i = 0, l = this._levelConfig.length; i < l; i++) {
            var levelInfo = this._levelConfig[i];
            levelInfo = typeof levelInfo === 'object' ? levelInfo : {path: levelInfo};
            var levelPath = levelInfo.path;
            var levelKey = 'level:' + levelPath;
            if (levelsIndex[levelPath]) {
                continue;
            }
            levelsIndex[levelPath] = true;
            if (!this.node.buildState[levelKey]) {
                var level = new Level(levelPath, this.node.getLevelNamingScheme(levelPath));
                if (levelInfo.check === false) {
                    var blocks = cache.get(levelPath);
                    if (blocks) {
                        level.loadFromCache(blocks);
                    } else {
                        levelsToCache.push(level);
                    }
                }
                this.node.buildState[levelKey] = level;
            }
            levelList.push(this.node.buildState[levelKey]);
        }

        return VowFs.listDir(path.join(_this.node.getRootDir(), _this.node.getPath()))
            .then(function (listDir) {
                return _this._sublevelDirectories.filter(function (path) {
                    return listDir.indexOf(path) !== -1;
                });
            })
            .then(function (sublevels) {
                return Vow.all(sublevels.map(function (path) {
                    var sublevelPath = _this.node.resolvePath(path);
                    if (!levelsIndex[sublevelPath]) {
                        levelsIndex[sublevelPath] = true;
                        levelList.push(new Level(sublevelPath, _this.node.getLevelNamingScheme(sublevelPath)));
                    }
                }));
            })
            .then(function () {
                return Vow.all(levelList.map(function (level) {
                        return level.load();
                    }))
                    .then(function () {
                        levelsToCache.forEach(function (level) {
                            cache.set(level.getPath(), level.getBlocks());
                        });
                        _this.node.resolveTarget(target, new Levels(levelList));
                    });
            });
    },

    clean: function () {}
});
