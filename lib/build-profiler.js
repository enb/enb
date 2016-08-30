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
        // информация о времени выполнения таргета
        var targetTimes = buildTimes[targetName];
        // начало выполнения таргета (включая время ожидания)
        var totalStartTime = targetTimes.startTime;
        // окончание выполнения таргета (включая время ожидания)
        var totalEndTime = targetTimes.endTime;
        // длительность выполнения таргета (без времини ожидания)
        var selfTime = 0;
        // отрезки чистого времени выполнения таргета (без времени ожидания)
        var timeline = [];

        if (deps.length) {
            var totalRange = { from: totalStartTime, to: totalEndTime };
            var depRanges = deps.map(function (depTarget) {
                var times = buildTimes[depTarget];

                return { from: times.startTime, to: times.endTime };
            });

            var selfRanges = rangem.subtract(totalRange, rangem.union(depRanges));

            selfTime = rangesDuration(selfRanges);
            timeline = rangesToTimeline(selfRanges);
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

        return _.map(this._buildTimes, function (targetBuildInfo, target) {
                return _.assign({ target: target }, targetBuildInfo);
            })
            .sort(function (a, b) { return b.selfTime - a.selfTime; });
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
            techMetrics.ranges = techMetrics.ranges.concat(timelineToRanges(targetBuildTimes.timeline));

            metricsByTech[tech] = techMetrics;
        });

        var totalTime = 0;
        var techMetrics = _.map(metricsByTech, function (metrics, tech) {
            var ranges = rangem.union(metrics.ranges);
            var buildTime = rangesDuration(ranges);

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

/**
 * @param {{from: Number, to: Number}[]} ranges
 *
 * @returns {{startTime: Number, endTime: Number}[]}
 */
function rangesToTimeline(ranges) {
    return ranges.map(function (range) {
        return {
            startTime: range.from,
            endTime: range.to
        };
    });
}

/**
 * @param {{startTime: Number, endTime: Number}[]} timeline
 *
 * @returns {{from: Number, to: Number}[]}
 */
function timelineToRanges(timeline) {
    return timeline.map(function (times) {
        return {
            from: times.startTime,
            to: times.endTime
        };
    });
}

/**
 * @param {{from: Number, to: Number}[]} ranges
 *
 * @returns {Number}
 */
function rangesDuration(ranges) {
    var duration = 0;

    ranges.forEach(function (range) {
        duration += range.to - range.from;
    });

    return duration;
}
