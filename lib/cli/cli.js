'use strict';

/**
 * CLI
 * ===
 *
 * Этот файл запускается из командной строки при сборке и прочем взаимодействии с ENB.
 */

var pkg = require('../../package.json');
var version = pkg.version;
var program = require('commander');

program.version(version);

require('./make.js')(program);
require('./server.js')(program);

program.command('*')
    .action(function () {
        program.outputHelp();
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
