var inherit = require('inherit'),
    middleware = require('./server-middleware'),
    express = require('express'),
    fs = require('fs');

module.exports = inherit({
    init: function(cdir, options) {
        this._port = options.port;
        this._host = options.host;
        this._socket = options.socket;
        this._options = options;
        this._options.cdir = cdir;
    },
    run: function() {
        var app = express(), _this = this;
        app.use(middleware.createMiddleware(this._options));
        var socket;
        function serverStarted() {
            console.log('Server started at ' + socket);
        }
        if (this._socket) {
            try {
                fs.unlinkSync(this._socket);
            }
            catch(e) {}
            socket = this._socket;
            app.listen(this._socket, function() {
                fs.chmod(_this._socket, '0777');
                serverStarted();
            });
        } else {
            socket = this._host + ':' + this._port;
            app.listen(this._port, this._host, serverStarted);
        }
        return app;
    }
});