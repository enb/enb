var inherit = require('inherit'),
    middleware = require('./server-middleware'),
    express = require('express');

module.exports = inherit({
    init: function(cdir, options) {
        this._port = options.port;
        this._host = options.host;
        this._options = options;
        this._options.cdir = cdir;
    },
    run: function() {
        var app = express();
        app.use(middleware.createMiddleware(this._options));
        app.listen(this._port, this._host);
        console.log('Server started at ' + this._host + ':' + this._port);
        return app;
    }
});