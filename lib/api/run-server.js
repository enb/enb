var path = require('path');
var vow = require('vow');
var Server = require('../server/server');

/**
 * Запускает разрабочичий сервер.
 *
 * @param {Object} [options]
 * @param {String} [options.mode=development]   Режим сборки.
 * @param {String} [options.dir=process.cwd()]  Корень проекта.
 * @param {Number} [options.port=8080]          Номер порта.
 * @param {String} [options.host=0.0.0.0]       Имя хоста.
 * @param {String} [options.socket]             Путь к сокету.
 * @returns {Promise}
 */
module.exports = function (options) {
    var server = new Server();
    var root = path.resolve(options.dir);
    var opts = {
        port: options.port || 8080,
        host: options.host || '0.0.0.0',
        socket: options.socket
    };

    return vow.when(server.init(root, opts))
        .then(function () {
            return server.run();
        });
};
