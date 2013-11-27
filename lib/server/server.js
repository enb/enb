/**
 * Server
 * ======
 */
var inherit = require('inherit');
var MakePlatform = require('../make');
var middleware = require('./server-middleware');
var express = require('express');
var fs = require('graceful-fs');
var path = require('path');
var vow = require('vow');

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
                app.use(express.static(_this._options.cdir));
                app.get('/', _this._indexPage.bind(_this));
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
                    } catch (e) {}
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
    },

    _indexPage: function (req, res) {
        var projectName = path.basename(this._options.cdir || process.cwd());
        var makePlatform = new MakePlatform();
        makePlatform.init(this._options.cdir).done(function () {
            makePlatform.loadCache();
            return makePlatform.buildTargets([]).then(function () {
                var htmlPages = [];
                var nodeConfigs = makePlatform.getProjectConfig().getNodeConfigs();
                Object.keys(nodeConfigs).forEach(function (nodeConfigPath) {
                    var nodeConfig = nodeConfigs[nodeConfigPath];
                    nodeConfig.getTargets().forEach(function (target) {
                        if (target.match(/\.html$/)) {
                            htmlPages.push(nodeConfig.getPath() + '/' + target);
                        }
                    });
                });

                var html = ['<!DOCTYPE HTML>'];
                html.push('<html>');
                html.push('<head>');
                html.push('    <title>' + projectName + '</title>');
                html.push('    <style>');
                html.push(
                    'body {' +
                    '  margin: 0;' +
                    '  padding: 80px 100px;' +
                    '  font: 13px "Helvetica Neue", "Lucida Grande", "Arial";' +
                    '  background: #fff;' +
                    '  background-repeat: no-repeat;' +
                    '  color: #555;' +
                    '  -webkit-font-smoothing: antialiased;' +
                    '}'
                );
                html.push(
                    'h1 {' +
                    '  margin: 0;' +
                    '  font-size: 60px;' +
                    '  color: #343434;' +
                    '}'
                );
                html.push(
                    'h2 {' +
                    '  margin: 40px 0px 10px;' +
                    '  font-size: 20px;' +
                    '  color: #343434;' +
                    '}'
                );
                html.push(
                    'a {' +
                    '  color: #555;' +
                    '}' +
                    'a:hover {' +
                    '  color: #303030;' +
                    '}'
                );
                html.push(
                    'ul {' +
                    '  margin: 0;' +
                    '  padding: 0;' +
                    '}' +
                    'ul li {' +
                    '  margin: 5px 0;' +
                    '  list-style: none;' +
                    '  font-size: 16px;' +
                    '}' +
                    'ul li a:before {' +
                    '  display: inline-block;' +
                    '  width: 16px;' +
                    '  height: 16px;' +
                    '  background: url(data:image/png;base64,' +
                        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA0ElEQVR42o2TzwqCQBCHfaneplOHrj1AB5+' +
                        'iNwg6R50Cjd4ggv4JhXfB27IK5uRvQNjGdseBjx1m5/cpghERMXEc0wiWHRHocz+Cuq7JWjugqipXsvAKUF' +
                        'mWSTBGsD8/HTOvIM9zSR90sV5BURQDRLHEKyjLMoQuMMYw1/PtX68L8MUP24SmkzndL0+AHjPc6YJkd0SAz' +
                        '6ZpgDsLC16PNy+uVxsShRnusBN+g3R/wiKfXMOZVyADeBoQQl2AQlD2ukApXYCfqW3bENjxC8biCr5jjTCh' +
                        'qbabBgAAAABJRU5ErkJggg==);' +
                    '  margin-right: 5px;' +
                    '  content: "";' +
                    '  vertical-align: bottom;' +
                    '}'
                );
                html.push('    </style>');
                html.push('</head>');
                html.push('<body>');
                html.push('<h1>' + projectName + '</h1>');
                if (htmlPages.length > 0) {
                    html.push('<h2>Available pages</h2>');
                    html.push('<ul>');
                    htmlPages.forEach(function (htmlPage) {
                        html.push('<li><a href="' + htmlPage + '">' + htmlPage + '</a></li>');
                    });
                    html.push('</ul>');
                } else {
                    html.push('No pages are configured');
                }
                html.push('<h2>Graph</h2>');

                html.push('<ul>');
                makePlatform.getBuildGraph().renderFragmentedPumlLinks().forEach(function (graphLink) {
                    html.push(
                        '<li>' +
                            '<img src="' + graphLink + '" />' +
                        '</li>'
                    );
                });
                html.push('</ul>');
                html.push('<h2>More info</h2>');
                html.push('<div><a href="https://github.com/enb-make/enb">ENB Readme</a></div>');
                html.push('</body>');
                html.push('</html>');
                res.end(html.join('\n'));
            });
        });
    }
});
