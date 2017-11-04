'use strict';

const path = require('path');

const Server = require('../server');

const cwd = process.cwd();

/**
 * Запускает разрабочичий сервер.
 *
 * @param {Object}  [options]
 * @param {string}  [options.dir=process.cwd()]  Корень проекта.
 * @param {Object}  [options.config]             Конфиг сборки. По умолчанию загружается из `.enb/make.js`.
 * @param {string}  [options.mode=development]   Режим сборки.
 * @param {boolean} [options.cache=true]         Учитывать кэш при запуске таска.
 * @param {number}  [options.port=8080]          Номер порта.
 * @param {string}  [options.host=localhost]     Имя хоста.
 * @param {string}  [options.socket]             Путь к сокету.
 * @param {boolean} [options.hideWarnings=false] Не выводить warning-сообщения в консоль.
 * @param {string}  [options.logLevel=info]      Уровень логирования.
 * @returns {Promise}
 */
module.exports = options => {
    options = options || {};

    const root = path.resolve(options.dir || cwd);
    const server = new Server({
        root,
        port: options.port,
        host: options.host,
        socket: options.socket,
        enbOptions: {
            dir: root,
            config: options.config,
            mode: options.mode,
            cache: !options.hasOwnProperty('cache') || options.cache,
            hideWarnings: options.hideWarnings,
            logLevel: options.logLevel
        }
    });

    return server.run();
};
