/**
 * BuildProfiler
 * ======
 */
var inherit = require('inherit');
var _ = require('lodash');
var rangem = require('rangem');
var percentile = require('percentile');

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
        var buildTimes = this._buildTimes;
        var targetTimes = buildTimes[targetName];
        var totalStartTime = targetTimes.startTime;
        var totalEndTime = targetTimes.endTime;
        var selfTime = 0;
        var timeline = [];

        if (deps.length) {
            var totalRange = { from: totalStartTime, to: totalEndTime };
            var depRanges = deps.map(function (depTarget) {
                var times = buildTimes[depTarget];

                return { from: times.startTime, to: times.endTime };
            });

            var selfRanges = rangem.subtract(totalRange, rangem.union(depRanges));

            selfRanges.forEach(function (range) {
                selfTime += range.to - range.from;
            });

            timeline = selfRanges.map(function (range) {
                return {
                    startTime: range.from,
                    endTime: range.to
                };
            });
        } else {
            selfTime = totalEndTime - totalStartTime;
            timeline = [{
                startTime: totalStartTime,
                endTime: totalEndTime
            }];
        }

        var totalTime = totalEndTime - totalStartTime;

        var benchmarkObj = {
            totalTime: totalTime,
            selfTime: selfTime,
            watingTime: totalTime - selfTime,
            timeline: timeline
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
     * @param {Object} buildTimes
     * @returns {Array}
     */
    calculateTechMetrics: function (buildTimes) {
        var metricsByTech = {};

        _.map(buildTimes, function (benchmark, target) {
            var tech = benchmark && benchmark.techName;
            var targetBuildTimes = buildTimes[target];

            if (!tech) { return; }

            var techMetrics = metricsByTech[tech] || { callNumber: 0, ranges: [], buildTimes: [] };

            techMetrics.callNumber++;
            techMetrics.buildTimes.push(targetBuildTimes.selfTime);
            techMetrics.ranges = techMetrics.ranges.concat(targetBuildTimes.timeline.map(function (times) {
                return {
                    from: times.startTime,
                    to: times.endTime
                };
            }));

            metricsByTech[tech] = techMetrics;
        });

        var totalTime = 0;
        var techMetrics = _.map(metricsByTech, function (metrics, tech) {
            var randges = rangem.union(metrics.ranges);

            var buildTime = 0;
            randges.forEach(function (range) {
                buildTime += range.to - range.from;
            });

            totalTime += buildTime;

            return {
                tech: tech,
                callNumber: metrics.callNumber,
                buildTime: buildTime,
                percentile95: percentile(95, metrics.buildTimes)
            };
        });

        return _.map(techMetrics, function (metrics) {
                return _.assign(metrics, {
                    buildTimePercent: calcPercent(metrics.buildTime, totalTime)
                });
            })
            .sort(function (a, b) {
                return b.buildTime - a.buildTime;
            });
    }
});

/**
 * @param {Number} buildTime
 * @param {Number} totalTime
 * @return {Number}
 */
function calcPercent(value, total) {
    return value > 0
        ? parseFloat(value / total * 100, 2)
        : 0;
}
