/**
 * CLI/make
 * ========
 *
 * Этот файл запускает сборку из командной строки.
 */
var make = require('../api').make;
var deprecate = require('../utils/deprecate');

module.exports = function (program) {
    program.command('make')
        .option('-n, --no-cache', 'drop cache before running make')
        .option('-m, --mode <mode>', 'mode of assembly [development]')
        .option('-d, --dir <dir>', 'custom project root')
        .option('-h, --hide-warnings', 'hides warnings')
        .option('--graph', 'draws build graph')
        .description('build specified targets')
        .action(function () {
            var args = program.args.slice(0);
            var cmd = args.pop();

            deprecate.initialize({hideWarnings: cmd.hideWarnings });

            make(args, cmd)
                .fail(function (err) {
                    console.error(err.stack);
                    process.exit(1);
                });
        });
};
