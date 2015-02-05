var vow = require('vow');
var cdir = process.cwd();
var Server = require('../server/server');

/**
 * Запускает разрабочичий сервер.
 *
 * @param {Object} [options]
 * @param {Number} [options.port=8080]     Номер порта.
 * @param {String} [options.host=0.0.0.0]  Имя хоста.
 * @param {String} [options.socket]        Путь к сокету.
 * @returns {Promise}
 */
module.exports = function (options) {
    var server = new Server();
    var opts = {
        port: options.port || 8080,
        host: options.host || '0.0.0.0',
        socket: options.socket
    };

    return vow.when(server.init(cdir, opts))
        .then(function () {
            return server.run();
        });
};
