'use strict';

/**
 * CLI/make
 * ========
 *
 * Этот файл запускает сборку из командной строки.
 */
const make = require('../api').make;
const profilerUI = require('../ui/profiler-ui');
const deprecate = require('../utils/deprecate');

module.exports = function (program) {
    program.command('make')
        .option('-n, --no-cache', 'drop cache before running make')
        .option('-m, --mode <mode>', 'mode of assembly [development]')
        .option('-d, --dir <dir>', 'custom project root')
        .option('-H, --hide-warnings', 'hides warnings')
        .option('--log-level <level>', 'log level (info, warn, error)')
        .option('--graph', 'draws build graph')
        .option('--profiler [type]', 'log build time of targets')
        .option('--profiler-percentiles <percentiles>', 'log percentiles of tech build times')
        .option('--build-info-file <file>', 'write build info to JSON file')
        .description('build specified targets')
        .action(function () {
            const args = program.args.slice(0);
            const opts = args.pop();

            const percentileRanks = opts.profilerPercentiles = opts.profilerPercentiles
                ? opts.profilerPercentiles.split(',')
                : [];

            deprecate.initialize({
                hideWarnings: opts ? opts.hideWarnings : false,
                logLevel: opts ? opts.logLevel : 'info'
            });

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
                        profilerUI.printTechPercentileTable(data.techPercentiles, percentileRanks);
                    }
                })
                .fail(function (err) {
                    console.error(err.stack);
                    process.exit(1);
                });
        });
};
