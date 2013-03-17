var Level = require('../lib/level-sync'),
    Levels = require('../lib/levels'),
    fs = require('fs'),
    Vow = require('vow'),
    inherit = require('inherit');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'levels';
    },

    init: function(node) {
        this.__base.apply(this, arguments);
        this._levelConfig = this.getRequiredOption('levels');
    },

    getTargets: function() {
        return [this.node.getTargetName('levels')];
    },

    build: function() {
        var _this = this,
            promise = Vow.promise();
        try {
            var target = this.node.getTargetName('levels'),
                levelList = [],
                levelsToCache = [],
                cache = this.node.getNodeCache(target);
            for (var i = 0, l = this._levelConfig.length; i < l; i++) {
                var levelInfo = this._levelConfig[i];
                levelInfo = typeof levelInfo == 'object' ? levelInfo : {path: levelInfo};
                var
                    levelPath = levelInfo.path,
                    levelKey = 'level:' + levelPath;
                if (!this.node.buildState[levelKey]) {
                    var level = new Level(levelPath);
                    if (levelInfo.check === false) {
                        var blocks = cache.get(levelPath);
                        if (blocks) {
                            level.setBlocks(blocks);
                            level.setLoaded();
                        } else {
                            levelsToCache.push(level);
                        }
                    }
                    this.node.buildState[levelKey] = level;
                }
                levelList.push(this.node.buildState[levelKey]);
            }
            fs.exists(this.node.resolvePath('blocks'), function(res) {
                try {
                    if (res) {
                        levelList.push(new Level(_this.node.resolvePath('blocks')));
                    }
                    return Vow.all(levelList.map(function(level) {
                        return level.load();
                    })).then((function() {
                        levelsToCache.forEach(function(level) {
                            cache.set(level.getPath(), level.getBlocks());
                        });
                        _this.node.resolveTarget(target, new Levels(levelList));
                        return promise.fulfill();
                    }), function(err) {
                        return promise.reject(err);
                    });
                } catch (err) {
                    return promise.reject(err);
                }
            });
        } catch (err) {
            promise.reject(err);
        }
        return promise;
    },

    clean: function() {}
});