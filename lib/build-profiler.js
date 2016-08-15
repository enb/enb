/**
 * BuildProfiler
 * ======
 */
var inherit = require('inherit'),
    _ = require('lodash'),
    percentile = require('percentile');

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
     * @param {String} techName
     * @param {Number} [time]
     */
    setStartTime: function (targetName, techName, time) {
        var targetTimes = this._buildTimes[targetName] || (this._buildTimes[targetName] = {});

        targetTimes.techName = techName;
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
            } else if (depEndTime < targetStartTime) {
                selfTime = targetEndTime - targetStartTime;
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
     * @param {Object} obj
     * @param {Function} mapper
     * @param {String} sortKey
     * @returns {Array}
     */
    objectToSortedArray: function (obj, mapper, sortKey) {
        return _(obj)
            .map(mapper)
            .compact()
            .value()
            .sort(function (a, b) { return b[sortKey] - a[sortKey]; });
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

        return this.objectToSortedArray(
                this._buildTimes,
                function (targetBuildInfo, target) {
                    return _.assign({ target: target }, targetBuildInfo);
                },
                'selfTime'
            );
    },

    /**
     * @param {Number} buildTime
     * @param {Number} totalTime
     * @return {Number}
     */
    getBuildTimePercent: function (buildTime, totalTime) {
        return buildTime > 0
            ? parseFloat(buildTime / totalTime * 100, 2).toFixed(2)
            : 0;
    },

    /**
     * @param {Object} buildTimes
     * @returns {Array}
     */
    calculateTechMetrics: function (buildTimes) {
        var metricsByTech = {};
        var totalTime = 0;
        var _this = this;

        _.map(buildTimes, function (benchmark, target) {
            var tech = benchmark && benchmark.techName;
            var selfTime = buildTimes[target].selfTime;

            if (!tech) { return; }

            var techMetrics = metricsByTech[tech] || { callNumber: 0, buildTime: 0, buildTimes: [] };

            techMetrics.callNumber++;
            techMetrics.buildTime += selfTime;
            techMetrics.buildTimes.push(selfTime);
            totalTime += selfTime;

            metricsByTech[tech] = techMetrics;
        });

        return this.objectToSortedArray(
                metricsByTech,
                function (metrics, tech) {
                    return {
                        tech: tech,
                        callNumber: metrics.callNumber,
                        buildTime: metrics.buildTime,
                        percentile95: percentile(95, metrics.buildTimes),
                        buildTimePercent: _this.getBuildTimePercent(metrics.buildTime, totalTime)
                    };
                },
                'buildTime'
            );
    }
});
