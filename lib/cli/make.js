/**
 * CLI/make
 * ========
 *
 * Этот файл запускает сборку из командной строки.
 */
var make = require('../api').make;
var deprecate = require('../utils/deprecate');
var cpuAverage = require('../utils/cpuAverage');

var CPU_USAGE_INTERVAL_MS = 1000;
var CPU_USAGE_FILENAME = 'cpu.png';

module.exports = function (program) {
    program.command('make')
        .option('-n, --no-cache', 'drop cache before running make')
        .option('-m, --mode <mode>', 'mode of assembly [development]')
        .option('-d, --dir <dir>', 'custom project root')
        .option('-H, --hide-warnings', 'hides warnings')
        .option('--cpu-usage', 'save graph of CPU usage to cpu.png')
        .option('--graph', 'draws build graph')
        .description('build specified targets')
        .action(function () {
            var args = program.args.slice(0);
            var cmd = args.pop();

            deprecate.initialize({ hideWarnings: cmd ? cmd.hideWarnings : false });

            var cpuUsageInterval;
            var cpuUsageData = { 0: '0' };
            var startTimestamp = Date.now();
            if (cmd.cpuUsage) {
                var startMeasure = cpuAverage();

                cpuUsageInterval = setInterval(function () {
                    var endMeasure = cpuAverage();

                    // Calculate the difference in idle and total time between the measures
                    var idleDifference = endMeasure.idle - startMeasure.idle;
                    var totalDifference = endMeasure.total - startMeasure.total;

                    // Calculate the average percentage CPU usage
                    var percentageCpu = 100 - Math.round(100 * idleDifference / totalDifference);
                    startMeasure = cpuAverage();

                    var ms = Date.now() - startTimestamp;
                    var sec = Math.ceil(ms / 1000);
                    cpuUsageData[sec] = percentageCpu;
                }, CPU_USAGE_INTERVAL_MS);
            }

            function _processCpuUsage() {
                if (cmd.cpuUsage) {
                    clearInterval(cpuUsageInterval);
                    dumpCpuUsage(cpuUsageData, CPU_USAGE_FILENAME);
                }
            }

            make(args, cmd)
                .then(function (res) {
                    _processCpuUsage();
                    return res;
                })
                .fail(function (err) {
                    _processCpuUsage();
                    console.error(err.stack);
                    process.exit(1);
                });
        });
};

function dumpCpuUsage(usageData, filename) {
    var plotter = require('plotter');
    plotter.plot({
        time: '%M:%S',
        data: { 'CPU, %': usageData },
        filename: filename
    });
}
