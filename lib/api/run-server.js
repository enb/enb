var path = require('path'),
    Server = require('../server'),
    cwd = process.cwd();

/**
 * Запускает разрабочичий сервер.
 *
 * @param {Object}  [options]
 * @param {String}  [options.dir=process.cwd()]  Корень проекта.
 * @param {Object}  [options.config]             Конфиг сборки. По умолчанию загружается из `.enb/make.js`.
 * @param {String}  [options.mode=development]   Режим сборки.
 * @param {Boolean} [options.cache=true]         Учитывать кэш при запуске таска.
 * @param {Number}  [options.port=8080]          Номер порта.
 * @param {String}  [options.host=0.0.0.0]       Имя хоста.
 * @param {String}  [options.socket]             Путь к сокету.
 * @returns {Promise}
 */
module.exports = function (options) {
    options = options || {};

    var root = path.resolve(options.dir || cwd),
        server = new Server({
            root: root,
            port: options.port,
            host: options.host,
            socket: options.socket,
            enbOptions: {
                dir: root,
                config: options.config,
                mode: options.mode,
                cache: !options.hasOwnProperty('cache') || options.cache,
            }
        });

    return server.run();
};
