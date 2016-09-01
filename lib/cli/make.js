/**
 * CLI/make
 * ========
 *
 * Этот файл запускает сборку из командной строки.
 */
var make = require('../api').make;
var profilerUI = require('../ui/profiler-ui');
var deprecate = require('../utils/deprecate');

module.exports = function (program) {
    program.command('make')
        .option('-n, --no-cache', 'drop cache before running make')
        .option('-m, --mode <mode>', 'mode of assembly [development]')
        .option('-d, --dir <dir>', 'custom project root')
        .option('-H, --hide-warnings', 'hides warnings')
        .option('--graph', 'draws build graph')
        .option('--profiler [type]', 'log build time of targets')
        .option('--profiler-percentiles <percentiles>', 'log percentiles of tech build times')
        .description('build specified targets')
        .action(function () {
            var args = program.args.slice(0);
            var opts = args.pop();

            var percentileRanks = opts.profilerPercentiles = opts.profilerPercentiles
                ? opts.profilerPercentiles.split(',')
                : [];

            deprecate.initialize({ hideWarnings: opts ? opts.hideWarnings : false });

            make(args, opts)
                .then(function (data) {
                    if (opts.profiler) {
                        if (opts.profiler === 'targets') {
                            profilerUI.printTargetTable(data.buildTimes);
                        } else {
                            profilerUI.printTechTable(data.techMetrics);
                        }
                    }

                    if (percentileRanks.length) {
                        profilerUI.printTechPercentileTable(data.techMetrics, percentileRanks);
                    }
                })
                .fail(function (err) {
                    console.error(err.stack);
                    process.exit(1);
                });
        });
};
