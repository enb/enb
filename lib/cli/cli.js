'use strict';

/**
 * CLI
 * ===
 *
 * Этот файл запускается из командной строки при сборке и прочем взаимодействии с ENB.
 */

const program = require('commander');

const pkg = require('../../package.json');
const version = pkg.version;


program.version(version);

require('./make.js')(program);
require('./server.js')(program);

program.command('*')
    .action(() => {
        program.outputHelp();
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
