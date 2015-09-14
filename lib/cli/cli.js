/**
 * CLI
 * ===
 *
 * Этот файл запускается из командной строки при сборке и прочем взаимодействии с ENB.
 */

var pkg = require('../../package.json');
var version = pkg.version;
var program = require('commander');

program
    .version(version)
    .parse(process.argv);

require('./make.js')(program);
require('./server.js')(program);

if (!program.args.length) {
    program.outputHelp();
}

program.command('*')
    .action(function () {
        program.outputHelp();
    });

program.parse(process.argv);
