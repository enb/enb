var path = require('path');
var vow = require('vow');
var Server = require('../server/server');
var cdir = process.cwd();

/**
 * Запускает разрабочичий сервер.
 *
 * @param {Object}  [options]
 * @param {String}  [options.mode=development]   Режим сборки.
 * @param {Boolean} [options.cache=true]         Учитывать кэш при запуске таска.
 * @param {String}  [options.dir=process.cwd()]  Корень проекта.
 * @param {Object}  [options.config]             Конфиг сборки. По умолчанию загружается из `.enb/make.js`.
 * @param {Number}  [options.port=8080]          Номер порта.
 * @param {String}  [options.host=0.0.0.0]       Имя хоста.
 * @param {String}  [options.socket]             Путь к сокету.
 * @returns {Promise}
 */
module.exports = function (options) {
    options = options || {};

    var server = new Server();
    var root = path.resolve(options.dir || cdir);
    var opts = {
        port: options.port || 8080,
        host: options.host || '0.0.0.0',
        socket: options.socket,
        config: options.config,
        mode: options.mode,
        cache: options.hasOwnProperty('cache') ? options.cache : true
    };

    return vow.when(server.init(root, opts))
        .then(function () {
            return server.run();
        });
};
