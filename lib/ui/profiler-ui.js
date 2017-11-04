'use strict';

const prettyMs = require('pretty-ms');
const Table = require('cli-table');

/**
 * Convert milliseconds to a human readable string.
 *
 * @param {Number} value
 *
 * @returns {String}
 */
function convertMs(value) {
    return Number.isFinite(value) ? prettyMs(value) : String(value);
}

module.exports = {
    printTechTable(data) {
        const printTable = new Table({
            head: ['Tech', 'Number of calls', 'Time spend (%)', 'Build Time']
        });

        data.forEach(techInfo => {
            printTable.push([
                techInfo.tech,
                techInfo.callNumber,
                techInfo.buildTimePercent.toFixed(3),
                convertMs(techInfo.buildTime)
            ]);
        });

        console.log(printTable.toString());
    },

    printTargetTable(data) {
        const printTable = new Table({
            head: ['Target', 'Self time', 'Wating time', 'Total time']
        });

        data.forEach(targetInfo => {
            printTable.push([
                targetInfo.target,
                convertMs(targetInfo.selfTime),
                convertMs(targetInfo.watingTime),
                convertMs(targetInfo.totalTime)
            ]);
        });

        console.log(printTable.toString());
    },

    printTechPercentileTable(techPercentiles, percentileRanks) {
        const printTable = new Table({
            head: ['Tech'].concat(percentileRanks.map(rank => `${rank}th`))
        });

        techPercentiles.forEach(techInfo => {
            printTable.push([techInfo.tech].concat(techInfo.percentiles.map(item => convertMs(item.value))));
        });

        console.log(printTable.toString());
    },
};
