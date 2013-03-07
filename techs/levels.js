var FileList = require('../lib/file-list'),
    Level = require('../lib/level'),
    Levels = require('../lib/levels'),
    fs = require('fs'),
    Vow = require('vow');

function LevelsTech(levelConfig) {
    this.levelConfig = levelConfig;
}

LevelsTech.prototype = {

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('levels')];
    },

    build: function() {
        var _this = this,
            promise = Vow.promise();
        try {
            var target = this.node.getTargetName('levels');
            var levelList = [];
            for (var i = 0, l = this.levelConfig.length; i < l; i++) {
                var levelPath = this.levelConfig[i],
                    levelKey = 'level:' + levelPath;
                if (!this.node.buildCache[levelKey]) {
                    this.node.buildCache[levelKey] = new Level(levelPath);
                }
                levelList.push(this.node.buildCache[levelKey]);
            }
            fs.exists(this.node.resolvePath('blocks'), function(res) {
                try {
                    if (res) {
                        levelList.push(new Level(_this.node.resolvePath('blocks')));
                    }
                    return Vow.all(levelList.map(function(level) {
                        return level.load();
                    })).then((function() {
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
    }
};

module.exports = LevelsTech;