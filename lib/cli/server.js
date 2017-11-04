'use strict';

/**
 * CLI/server
 * ========
 *
 * Этот файл запускает ENB-сервер из командной строки.
 */
var runServer = require('../api/run-server');

module.exports = function (program) {
program
    .command('server')
    .description('run development server')
    .option('-n, --no-cache', 'drop cache before running make')
    .option('-m, --mode <mode>', 'mode of assembly [development]')
    .option('-d, --dir <dir>', 'custom project root')
    .option('-p, --port <port>', 'socket port [8080]')
    .option('-H, --host <host>', 'socket host [localhost]')
    .option('-s, --socket <socket>', 'unix socket path')
    .option('--hide-warnings', 'hides warnings')
    .option('--log-level <level>', 'log level (info, warn, error)')
    .action(function (options) {
        runServer(options)
            .fail(function (err) {
                console.error(err.stack);
                process.exit(1);
            });
    });
};
