var _ = require('lodash');
var prettyMs = require('pretty-ms');
var Table = require('cli-table');

module.exports = {
    printTechTable: function (printData) {
        var printTable = new Table({
            head: ['Tech', 'Number of calls', 'Time spend (%)']
        });

        _.map(printData, function (techInfo) {
            printTable.push([
                techInfo.tech,
                techInfo.callNumber,
                techInfo.buildTimePercent
            ]);
        });

        console.log(printTable.toString());
    },

    printTargetTable: function (printData) {
        var printTable = new Table({
            head: ['Target', 'Self time', 'Wating time', 'Total time']
        });

        _.map(printData, function (targetInfo) {
            printTable.push([
                targetInfo.target,
                prettyMs(targetInfo.selfTime),
                prettyMs(targetInfo.watingTime),
                prettyMs(targetInfo.totalTime)
            ]);
        });

        console.log(printTable.toString());
    }
};
