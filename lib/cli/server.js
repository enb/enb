var path = require('path'),
    cdir = process.cwd(),
    Server = require('../server/server'),
    Vow = require('vow'),
    argv = require('optimist')
        .boolean('cache')
        .string('port')
        .string('host')
        .default({cache: true, port: 1234, host: '0.0.0.0'})
        .argv;

server = new Server();

Vow.when(server.init(cdir, argv)).then((function() {
    return server.run();
})).then(null, function(err) {
    console.error(err.stack);
    process.exit(1);
});