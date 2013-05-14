/**
 * levels
 * ======
 *
 * Собирает информацию об уровнях переопределения проекта, предоставляет `?.levels`. Результат выполнения этой технологии необходим технологиям `enb/techs/deps`, `enb/techs/deps-old` и `enb/techs/files`.
 *
 * Для каждой ноды по умолчанию добавляется уровень `<путь_к_ноде>/blocks`. Например, для ноды `pages/index` — `pages/index/blocks`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.levels`.
 * * *(String|Object)[]* **levels** — Уровни переопределения. Полные пути к папкам с уровнями переопределения. Вместо строки с уровнем может использоваться объект вида `{path: '/home/user/www/proj/lego/blocks-desktop', check: false}` для того, чтобы закэшировать содержимое тех уровней переопределения, которые не модифицируются в рамках проекта.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/levels'), {
 *   levels: [
 *     {path: 'lego/blocks-desktop', check: false},
 *     'desktop.blocks'
 *   ].map(function(level) { return config.resolvePath(level); })
 * } ]);
 * ```
 */
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
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.levels'));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var _this = this,
            promise = Vow.promise();
        try {
            var target = this._target,
                levelList = [],
                levelsToCache = [],
                levelsIndex = {},
                cache = this.node.getNodeCache(target);
            for (var i = 0, l = this._levelConfig.length; i < l; i++) {
                var levelInfo = this._levelConfig[i];
                levelInfo = typeof levelInfo == 'object' ? levelInfo : {path: levelInfo};
                var
                    levelPath = levelInfo.path,
                    levelKey = 'level:' + levelPath;
                if (levelsIndex[levelPath]) continue;
                levelsIndex[levelPath] = true;
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
            var pageBlocksPath = this.node.resolvePath('blocks');
            fs.exists(pageBlocksPath, function(res) {
                try {
                    if (res && !levelsIndex[pageBlocksPath]) {
                        levelsIndex[pageBlocksPath] = true;
                        levelList.push(new Level(pageBlocksPath));
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
