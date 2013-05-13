/**
 * CLI/server
 * ========
 *
 * Этот файл запускает ENB-сервер из командной строки.
 */
var path = require('path'),
    cdir = process.cwd(),
    Server = require('../server/server'),
    Vow = require('vow');

module.exports = function(program) {
program
    .command('server')
    .description('run development server')
    .option("-p, --port <port>", "socket port [8080]")
    .option("-h, --host <host>", "socket host [0.0.0.0]")
    .option("-s, --socket <socket>", "unix socket path")
    .action(function(options){
        var opts = {
                port: options.port || 8080,
                host: options.host || '0.0.0.0',
                socket: options.socket
            },
            server = new Server();
        Vow.when(server.init(cdir, opts)).then((function() {
            return server.run();
        })).then(null, function(err) {
            console.error(err.stack);
            process.exit(1);
        });
    });
};

