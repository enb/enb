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
        .description('build specified targets')
        .action(function () {
            var args = program.args.slice(0);
            var cmd = args.pop();

            deprecate.initialize({ hideWarnings: cmd ? cmd.hideWarnings : false });

            make(args, cmd)
                .then(function (data) {
                    if (cmd.profiler) {
                        if (cmd.profiler === 'targets') {
                            profilerUI.printTargetTable(data.buildTimes);
                        } else {
                            profilerUI.printTechTable(data.techMetrics);
                        }
                    }
                })
                .fail(function (err) {
                    console.error(err.stack);
                    process.exit(1);
                });
        });
};
