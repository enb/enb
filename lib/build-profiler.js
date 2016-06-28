/**
 * BuildProfiler
 * ======
 */
var inherit = require('inherit'),
    _ = require('lodash');

/**
 * BuildProfiler
 * ============
 *
 * Накапливает знания о времени сборки таргетов.
 * @name BuildProfiler
 * @class
 */
module.exports = inherit(/** @lends BuildProfiler.prototype */ {

    /**
     * Конструктор.
     * @param {Object} buildTimes
     * @private
     */
    __constructor: function (buildTimes) {
        this._buildTimes = buildTimes || {};
    },

    /**
     * Устанавливает время начала работы для указанного таргета.
     * Если время не указано, то будет записано текущее.
     * @param {String} targetName
     * @param {Number} [time]
     */
    setStartTime: function (targetName, time) {
        var targetTimes = this._buildTimes[targetName] || (this._buildTimes[targetName] = {});

        targetTimes.startTime = time || Date.now();
    },

    /**
     * Устанавливает время окончания работы для указанного таргета.
     * Если время не указано, то будет записано текущее.
     * @param {String} targetName
     * @param {Number} [time]
     */
    setEndTime: function (targetName, time) {
        if (this._buildTimes[targetName]) {
            this._buildTimes[targetName].endTime = time ? time : Date.now();
        }
    },

    /**
     * @param {String} targetName
     * @param {Object} targetsBuildTimes
     * @param {String[]} deps
     */
    _calculateTargetBuildTime: function (targetName, deps) {
        var selfTime = 0;
        var targetTimes = this._buildTimes[targetName];
        var targetStartTime = targetTimes.startTime;
        var targetEndTime = targetTimes.endTime;

        if (deps.length) {
            var depsTime = { start: [], end: [] };

            for (var i = 0; i < deps.length; i++) {
                var depTargetName = deps[i],
                    depTargetTimes = this._buildTimes[depTargetName];

                depsTime.start.push(depTargetTimes.startTime);
                depsTime.end.push(depTargetTimes.endTime);
            }

            // время начала ожидания зависимостей
            var depStartTime = Math.min.apply(Math, depsTime.start);
            // время окончания ожидания зависимостей
            var depEndTime = Math.max.apply(Math, depsTime.end);

            selfTime = targetEndTime - depEndTime;

            if (depStartTime > targetStartTime) {
                var timBefore = (depStartTime - targetStartTime);
                selfTime += timBefore;
            }
        } else {
            selfTime = targetEndTime - targetStartTime;
        }

        var totalTime = targetEndTime - targetStartTime;

        var benchmarkObj = {
            totalTime: totalTime,
            selfTime: selfTime,
            watingTime: totalTime - selfTime
        };

        this._buildTimes[targetName] = _.assign(this._buildTimes[targetName], benchmarkObj);
    },

    /**
     * Вычисляет время выполнения каждого таргета.
     * @param {BuildGraph} graph
     * @returns {Object}
     */
    calculateBuildTimes: function (graph) {
        var _this = this;

        Object.keys(this._buildTimes).map(function (targetName) {
            var deps = graph.getDirectDeps(targetName);
            _this._calculateTargetBuildTime(targetName, deps);
        });

        return this._buildTimes;
    }
});
