'use strict';

/**
 * BuildProfiler
 * ======
 */
const inherit = require('inherit');
const percentile = require('percentile');
const rangem = require('rangem');

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
    __constructor(buildTimes) {
        this._buildTimes = buildTimes || {};
    },

    /**
     * Устанавливает время начала работы для указанного таргета.
     * Если время не указано, то будет записано текущее.
     * @param {String} targetName
     * @param {String} techName
     * @param {Number} [time]
     */
    setStartTime(targetName, techName, time) {
        const targetTimes = this._buildTimes[targetName] || (this._buildTimes[targetName] = {});

        targetTimes.techName = techName;
        targetTimes.startTime = time || Date.now();
    },

    /**
     * Устанавливает время окончания работы для указанного таргета.
     * Если время не указано, то будет записано текущее.
     * @param {String} targetName
     * @param {Number} [time]
     */
    setEndTime(targetName, time) {
        if (this._buildTimes[targetName]) {
            this._buildTimes[targetName].endTime = time ? time : Date.now();
        }
    },

    /**
     * @param {String} targetName
     * @param {String[]} deps
     */
    _calculateTargetBuildTime(targetName, deps) {
        const buildTimes = this._buildTimes;
        // информация о времени выполнения таргета
        const targetTimes = buildTimes[targetName];
        // начало выполнения таргета (включая время ожидания)
        const totalStartTime = targetTimes.startTime;
        // окончание выполнения таргета (включая время ожидания)
        const totalEndTime = targetTimes.endTime;
        // длительность выполнения таргета (без времини ожидания)
        let selfTime = 0;
        // отрезки чистого времени выполнения таргета (без времени ожидания)
        let timeline = [];

        if (deps.length) {
            const totalRange = { from: totalStartTime, to: totalEndTime };
            const depRanges = deps.map(depTarget => {
                const times = buildTimes[depTarget];

                return { from: times.startTime, to: times.endTime };
            });

            const selfRanges = rangem.subtract(totalRange, rangem.union(depRanges));

            selfTime = rangesDuration(selfRanges);
            timeline = rangesToTimeline(selfRanges);
        } else {
            selfTime = totalEndTime - totalStartTime;
            timeline = [{
                startTime: totalStartTime,
                endTime: totalEndTime
            }];
        }

        const totalTime = totalEndTime - totalStartTime;

        const benchmarkObj = {
            totalTime,
            selfTime,
            watingTime: totalTime - selfTime,
            timeline
        };

        this._buildTimes[targetName] = Object.assign(this._buildTimes[targetName], benchmarkObj);
    },

    /**
     * Вычисляет время выполнения каждого таргета.
     * @param {BuildGraph} graph
     * @returns {Array}
     */
    calculateBuildTimes(graph) {
        Object.keys(this._buildTimes).forEach((target) => {
            const deps = graph.getDirectDeps(target);

            this._calculateTargetBuildTime(target, deps);
        });

        return Object.keys(this._buildTimes).map((target) => {
            const targetBuildInfo = this._buildTimes[target];

            return Object.assign({ target }, targetBuildInfo);
        }).sort((a, b) => b.selfTime - a.selfTime);
    },

    /**
     * @param {Object} buildTimes
     * @returns {Array}
     */
    calculateTechMetrics(buildTimes) {
        const metricsByTech = {};

        buildTimes.forEach((benchmark, target) => {
            const tech = benchmark && benchmark.techName;
            const targetBuildTimes = buildTimes[target];

            if (!tech) { return; }

            const techMetrics = metricsByTech[tech] || { callNumber: 0, ranges: [], buildTimes: [] };

            techMetrics.callNumber++;
            techMetrics.buildTimes.push(targetBuildTimes.selfTime);
            techMetrics.ranges = techMetrics.ranges.concat(timelineToRanges(targetBuildTimes.timeline));

            metricsByTech[tech] = techMetrics;
        });

        let totalTime = 0;
        const techMetrics = Object.keys(metricsByTech).map(tech => {
            const metrics = metricsByTech[tech];
            const ranges = rangem.union(metrics.ranges);
            const buildTime = rangesDuration(ranges);

            totalTime += buildTime;

            return {
                tech,
                callNumber: metrics.callNumber,
                buildTime,
                buildTimes: metrics.buildTimes
            };
        });

        return techMetrics.map(metrics => {
                return Object.assign(metrics, {
                    buildTimePercent: calcPercent(metrics.buildTime, totalTime)
                });
            })
            .sort((a, b) => b.buildTime - a.buildTime);
    },
    /**
     * @param {Object} techMetrics
     * @param {number[]} percentileRanks
     *
     * @returns {{tech: string, percentiles: {rank: number, value: number}[]}[]}
     */
    calculateTechPercentiles(techMetrics, percentileRanks) {
        const sortedPercentileRanks = percentileRanks.sort((a, b) => a - b);
        const maxPercentileRankIndex = sortedPercentileRanks.length - 1;

        if (percentileRanks.length === 0) {
            return [];
        }

        return techMetrics.map(techInfo => ({
            tech: techInfo.tech,

            percentiles: sortedPercentileRanks.map(percentileRank => ({
                rank: percentileRank,
                value: percentile(percentileRank, techInfo.buildTimes)
            }))
        }))
        .sort((tech1, tech2) => {
            const percentiles1 = tech1.percentiles;
            const percentiles2 = tech2.percentiles;

            return percentiles2[maxPercentileRankIndex].value - percentiles1[maxPercentileRankIndex].value;
        });
    }
});

/**
 * @param {number} value
 * @param {number} total
 * @return {number}
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
    return ranges.map(range => ({
        startTime: range.from,
        endTime: range.to
    }));
}

/**
 * @param {{startTime: Number, endTime: Number}[]} timeline
 *
 * @returns {{from: Number, to: Number}[]}
 */
function timelineToRanges(timeline) {
    return timeline.map(times => ({
        from: times.startTime,
        to: times.endTime
    }));
}

/**
 * @param {{from: Number, to: Number}[]} ranges
 *
 * @returns {Number}
 */
function rangesDuration(ranges) {
    let duration = 0;

    ranges.forEach(range => {
        duration += range.to - range.from;
    });

    return duration;
}
