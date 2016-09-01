var _ = require('lodash');
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
                techInfo.buildTimePercent.toFixed(3),
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

    printTechPercentileTable: function (techPercentiles, percentileRanks) {
        var printTable = new Table({
            head: ['Tech'].concat(percentileRanks.map(function (rank) {
                return rank + 'th';
            }))
        });

        techPercentiles.map(function (techInfo) {
            printTable.push([techInfo.tech].concat(techInfo.percentiles.map(function (item) {
                return prettyMs(item.value);
            })));
        });

        console.log(printTable.toString());
    },
};
