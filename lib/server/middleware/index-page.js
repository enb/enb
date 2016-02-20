var EOL = require('os').EOL,
    path = require('path'),
    _ = require('lodash'),
    vow = require('vow'),
    MakePlatform = require('../../make');

module.exports = function (options) {
    return function (req, res, next) {
        if (req.method === 'GET' && req.url === '/') {
            var projectName = path.basename(options.dir),
                makePlatform = new MakePlatform();

            makePlatform.init(options.dir, options.mode, options.config, { graph: true }).done(function () {
                return vow.resolve(options.cache ? makePlatform.loadCacheAsync() : true).then(function () {
                    return makePlatform.buildTargets([]);
                }).then(function () {
                    var htmlPages = [],
                        nodeConfigs = makePlatform.getProjectConfig().getNodeConfigs();

                    _.map(nodeConfigs, function (nodeConfig) {
                        nodeConfig.getTargets().forEach(function (target) {
                            if (/\.html$/.test(target)) {
                                htmlPages.push(path.join(nodeConfig.getPath(), target));
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

                    makePlatform.saveCache();
                    makePlatform.destruct();

                    res.end(html.join(EOL));
                });
            });
        } else {
            next();
        }
    };
};
