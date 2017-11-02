/**
 * Server
 * ======
 */
var fs = require('fs'),
    path = require('path'),
    vow = require('vow'),
    inherit = require('inherit'),
    chalk = require('chalk'),
    connect = require('connect'),
    index = require('./middleware/index-page'),
    enb = require('./middleware/enb'),
    favicon = require('serve-favicon'),
    serveStatic = require('serve-static');

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
    __constructor: function (options) {
        options = options || {};

       this._root = options.root;
       this._port = options.port || 8080;
       this._host = options.host || 'localhost';
       this._socket = options.socket;
       this._enbOptions = options.enbOptions;
    },

    _createApp: function () {
        var root = this._root,
            enbOptions = this._enbOptions;

        return connect()
            .use(favicon(path.join(__dirname, 'favicon.ico')))
            .use(index(enbOptions))
            .use(enb(enbOptions))
            .use(serveStatic(root, { redirect: false }));
    },

    run: function () {
        var app = this._createApp(),
            defer = vow.defer();

        var socket = this._socket,
            message = 'ENB server started at ' + chalk.underline('http://' + this._host + ':' + this._port);

        if (socket) {
            try {
                fs.unlinkSync(socket);
            } catch (e) {}

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
