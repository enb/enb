'use strict';

/**
 * Server
 * ======
 */
const fs = require('fs');
const path = require('path');

const vow = require('vow');
const inherit = require('inherit');
const chalk = require('chalk');
const connect = require('connect');
const favicon = require('serve-favicon');
const serveStatic = require('serve-static');

const index = require('./middleware/index-page');
const enb = require('./middleware/enb');

/**
 * Cервер для сборки таргетов.
 *
 * @param {String} root                 Корень проекта.
 * @param {Object} opts
 * @param {Object} opts.enbOptions
 * @param {Number} [opts.port=8080]     Номер порта.
 * @param {String} [opts.host=localhost]  Имя хоста.
 * @param {String} [opts.socket]        Путь к сокету.
 * @name ENBServer
 * @constructor
 */
module.exports = inherit({
    __constructor(options) {
        options = options || {};

       this._root = options.root;
       this._port = options.port || 8080;
       this._host = options.host || 'localhost';
       this._socket = options.socket;
       this._enbOptions = options.enbOptions;
    },

    _createApp() {
        const root = this._root;
        const enbOptions = this._enbOptions;

        return connect()
            .use(favicon(path.join(__dirname, 'favicon.ico')))
            .use(index(enbOptions))
            .use(enb(enbOptions))
            .use(serveStatic(root, { redirect: false }));
    },

    run() {
        const app = this._createApp();
        const defer = vow.defer();
        const socket = this._socket;
        const message = `ENB server started at ${chalk.underline(`http://${this._host}:${this._port}`)}`;

        if (socket) {
            try {
                fs.unlinkSync(socket);
            } catch (e) {
                // continue regardless of error
            }

            app.listen(socket, () => {
                fs.chmod(socket, '0777');
                console.log(message);

                defer.resolve();
            });
        } else {
            app.listen(this._port, this._host, () => {
                console.log(message);

                defer.resolve();
            });
        }

        return defer.promise();
    }
});
