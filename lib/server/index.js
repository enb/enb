/**
 * Server
 * ======
 */
var fs = require('fs');
var path = require('path');
var vow = require('vow');
var inherit = require('inherit');
var chalk = require('chalk');
var connect = require('connect');
var index = require('./middleware/index-page');
var enb = require('./middleware/enb');
var favicon = require('serve-favicon');
var serveStatic = require('serve-static');

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
        var root = this._root;
        var enbOptions = this._enbOptions;

        return connect()
            .use(favicon(path.join(__dirname, 'favicon.ico')))
            .use(index(enbOptions))
            .use(enb(enbOptions))
            .use(serveStatic(root, { redirect: false }));
    },

    run() {
        var app = this._createApp();
        var defer = vow.defer();
        var socket = this._socket;
        var message = 'ENB server started at ' + chalk.underline('http://' + this._host + ':' + this._port);

        if (socket) {
            try {
                fs.unlinkSync(socket);
            } catch (e) {
                // continue regardless of error
            }

            app.listen(socket, function () {
                fs.chmod(socket, '0777');
                console.log(message);

                defer.resolve();
            });
        } else {
            app.listen(this._port, this._host, function () {
                console.log(message);

                defer.resolve();
            });
        }

        return defer.promise();
    }
});
