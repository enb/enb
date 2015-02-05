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
    .option('-p, --port <port>', 'socket port [8080]')
    .option('-h, --host <host>', 'socket host [0.0.0.0]')
    .option('-s, --socket <socket>', 'unix socket path')
    .action(function (options) {
        runServer(options)
            .fail(function (err) {
                console.error(err.stack);
                process.exit(1);
            });
    });
};
