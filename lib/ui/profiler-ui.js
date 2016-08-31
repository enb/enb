var _ = require('lodash');
var percentile = require('percentile');
var prettyMs = require('pretty-ms');
var Table = require('cli-table');

module.exports = {
    printTechTable: function (data) {
        var printTable = new Table({
            head: ['Tech', 'Number of calls', 'Time spend (%)', 'Build Time']
        });

        _.map(data, function (techInfo) {
            printTable.push([
                techInfo.tech,
                techInfo.callNumber,
                techInfo.buildTimePercent,
                prettyMs(techInfo.buildTime)
            ]);
        });

        console.log(printTable.toString());
    },

    printTargetTable: function (data) {
        var printTable = new Table({
            head: ['Target', 'Self time', 'Wating time', 'Total time']
        });

        _.map(data, function (targetInfo) {
            printTable.push([
                targetInfo.target,
                prettyMs(targetInfo.selfTime),
                prettyMs(targetInfo.watingTime),
                prettyMs(targetInfo.totalTime)
            ]);
        });

        console.log(printTable.toString());
    },

    printTechPercentileTable: function (data, percentiles) {
        var printTable = new Table({
            head: ['Tech'].concat(percentiles)
        });

        _.map(data, function (techInfo) {
            printTable.push([techInfo.tech].concat(percentiles.map(function (percentileNumber) {
                var time = percentile(percentileNumber, techInfo.buildTimes);

                return prettyMs(time);
            })));
        });

        console.log(printTable.toString());
    },
};
