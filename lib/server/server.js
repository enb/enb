/**
 * Server
 * ======
 */
var inherit = require('inherit'),
    MakePlatform = require('../make'),
    middleware = require('./server-middleware'),
    express = require('express'),
    fs = require('fs');

/**
 * Server умеет запускать web-сервер на основе express, обрабатывая запросы с помощью ENB.
 * @name Server
 */
module.exports = inherit({

    init: function(cdir, options) {
        this._port = options.port;
        this._host = options.host;
        this._socket = options.socket;
        this._options = options;
        this._options.cdir = cdir;
    },

    run: function() {
        var _this = this,
            makePlatform = new MakePlatform();
        makePlatform.init(this._options.cdir).then(function() {
            makePlatform.loadCache();
            return makePlatform.buildTargets([]).then(function() {
                makePlatform.saveCache();
                makePlatform.destruct();
                var app = express();
                app.use(middleware.createMiddleware(_this._options));
                process.on('uncaughtException', function(err) {
                    console.log(err.stack);
                });
                var socket;
                function serverStarted() {
                    console.log('Server started at ' + socket);
                }
                if (_this._socket) {
                    try {
                        fs.unlinkSync(_this._socket);
                    }
                    catch(e) {}
                    socket = _this._socket;
                    app.listen(_this._socket, function() {
                        fs.chmod(_this._socket, '0777');
                        serverStarted();
                    });
                } else {
                    socket = _this._host + ':' + _this._port;
                    app.listen(_this._port, _this._host, serverStarted);
                }
            });
        }).then(null, function(err) {
            console.log(err.stack);
            process.exit(1);
        });
    }
});
