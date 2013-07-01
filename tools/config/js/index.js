function ENBController($scope) {

    $scope.addProject = function() {
        $scope.data.projects.push({
            name: $scope.data.newProject.name
        });
        $scope.data.newProject.name = '';
    };

    $scope.addNode = function(project) {
        project.nodes = project.nodes || [];
        project.nodes.push({
            name: project._newNodeName,
            baseName: (project._newNodeName || '').replace(/.*\/([^\/]+)/, '$1'),
            levels: []
        });
        project._newNodeName = '';
    };

    $scope.addNodeResultFile = function(node) {
        (node.resultFiles || (node.resultFiles = [])).push({ext: node._newResultFile});
        node._newResultFile = '';
    };

    $scope.getBuildResult = function(project) {
        return 'module.exports = function(config) {\n'
            + (project.languages && project.languages.length ?
                '    config.setLanguages([' +
                        project.languages.map(function(l) { return JSON.stringify(l); }).join(', ')
                    + ']);\n'
                : '')
            + buildNodeJsModes(project)
            + '\n\n' +
            (project.nodes || []).map(function(node) {
                return [
                    '    config.node(' + JSON.stringify(node.name) + ', function(nodeConfig) {\n'
                    + buildNodeJs(node, project)
                    + '\n    });'
                ]
            })
            +
            '\n}';
    };
    function buildNodeJs(node, project) {
        var techCodes = [];
        techCodes.push('[ require("enb/techs/levels"), { levels: getLevels() } ]');
        if (node.bemdeclSource == 'bemjson') {
            techCodes.push('[ require("enb/techs/file-provider"), { target: "?.bemjson.js" } ]');
            techCodes.push('require("enb/techs/bemdecl-from-bemjson")');
        } else {
            techCodes.push('[ require("enb/techs/file-provider"), { target: "?.bemdecl.js" } ]');
        }
        techCodes.push('require("enb/techs/deps-old")');
        techCodes.push('require("enb/techs/files")');
        techCodes = techCodes.concat(buildNodeJsTechs(node, project));
        var techCodeHash = {};
        for (var i = 0, l = techCodes.length; i < l; i++) {
            techCodeHash[techCodes[i]] = true;
        }
        techCodes = [];
        for (i in techCodeHash) {
            if (techCodeHash.hasOwnProperty(i)) {
                techCodes.push(i);
            }
        }
        var res = '        nodeConfig.addTechs([\n            '
            + techCodes.join(',\n            ') + '\n        ]);';

        res += buildNodeJsTargets(node) + '\n';
        res += '\n        function getLevels() {\n            return [\n                ';
        res += node.levels.map(function(l) {
            return angular.toJson(l);
        }).join(',\n                ');
        res += '\n            ].map(function(l) { return config.resolvePath(l); });';
        res += '\n        }';
        return res;
    }
    function buildNodeJsModes(project) {
        var devModeTechs = {},
            prodModeTechs = {};
        (project.nodes || []).forEach(function(node) {
            (node.resultFiles || []).forEach(function(res) {
                switch (res.ext) {
                    case 'js':
                    case 'css':
                    case 'ie.css':
                    case 'ie6.css':
                    case 'ie7.css':
                    case 'ie8.css':
                    case 'ie9.css':
                    case 'priv.js':
                    case '{lang}.js':
                    case '{lang}.priv.js':
                        (devModeTechs[node.name] || (devModeTechs[node.name] = []))
                            .push(
                                '[ require("enb/techs/file-copy"), { sourceTarget: "?.' + res.ext + '", destTarget: "_?.' + res.ext + '" } ]'
                            );
                        (prodModeTechs[node.name] || (prodModeTechs[node.name] = []))
                            .push(
                                '[ require("enb/techs/borschik"), { sourceTarget: "?.' + res.ext + '", destTarget: "_?.' + res.ext + '", minify: true, freeze: false } ]'
                            );
                        break;
                }
            });
        });
        var modes = [['development', devModeTechs], ['production', prodModeTechs]];

        return modes.map(function(mode) {
            var techs = mode[1];
            return '    config.mode("' + mode[0] + '", function() {\n        '
                + Object.keys(techs).map(function(nodeName) {
                    return 'config.node("' + nodeName + '", function(nodeConfig) {\n'
                        + '            nodeConfig.addTechs([\n                '
                        + techs[nodeName].join(',\n                ')
                        + '\n            ]);\n        });'
                })
                + '\n    });'
        }).join('\n');
    }

    function buildNodeJsTechs(node, project) {
        return [].concat.apply([], (node.resultFiles || []).map(function(file) {
            switch (file.ext) {
                case 'css':
                    return 'require("enb/techs/css")';
                case 'ie.css':
                case 'ie6.css':
                case 'ie7.css':
                case 'ie8.css':
                case 'ie9.css':
                    return 'require("enb/techs/css-' + file.ext.split('.')[0] + '")';
                case 'js':
                    return 'require("enb/techs/js")';
                case 'priv.js':
                    return [
                        'require("enb-bemhtml/techs/bemhtml")',
                        'require("enb/techs/priv-js")'
                    ];
                case '{lang}.priv.js':
                    return [
                        '[ require("enb/techs/i18n-merge-keysets"), { lang: "all" }]',
                        '[ require("enb/techs/i18n-merge-keysets"), { lang: "{lang}" }]',
                        '[ require("enb/techs/i18n-merge-keysets"), { lang: "{lang}" }]',
                        '[ require("enb/techs/i18n-lang-js"), { lang: "all" } ]',
                        '[ require("enb/techs/i18n-lang-js"), { lang: "{lang}" } ]',
                        'require("enb-bemhtml/techs/bemhtml")',
                        'require("enb/techs/priv-js")',
                        '[ require("enb/techs/priv-js-i18n"), { lang: "{lang}" } ]'
                    ];
                    break;
                case '{lang}.js':
                    return [
                        '[ require("enb/techs/i18n-merge-keysets"), { lang: "all" }]',
                        '[ require("enb/techs/i18n-merge-keysets"), { lang: "{lang}" }]',
                        '[ require("enb/techs/i18n-merge-keysets"), { lang: "{lang}" }]',
                        '[ require("enb/techs/i18n-lang-js"), { lang: "all" } ]',
                        '[ require("enb/techs/i18n-lang-js"), { lang: "{lang}" } ]',
                        '[ require("enb/techs/js-i18n"), { lang: "{lang}" } ]'
                    ];
                case 'html':
                    return [
                        '[ require("enb/techs/file-provider"), { target: "?.bemjson.js" } ]',
                        'require("enb-bemhtml/techs/bemhtml")',
                        'require("enb/techs/html-from-bemjson")'
                    ];
            }
        }));
    }
    function buildNodeJsTargets(node) {
        return '\n        nodeConfig.addTargets(['
            + (node.resultFiles || []).map(function(res) {
                var target = '';
                switch (res.ext) {
                    case 'html':
                        target = '?.html';
                        break;
                    default:
                        target = '_?.' + res.ext;
                        break;
                }
                return JSON.stringify(target);
            }).join(', ') + ']);';
    }
    $scope.loadSettings = function(settings) {
        $scope.data = angular.fromJson(settings);
        $scope.data.projects = $scope.data.projects || [];
        $scope.data.newProject = $scope.data.newProject || {};
    };
    $scope.loadSettings(localStorage['enb-config-settings'] || '{}');
    window.setInterval(function() {
        localStorage['enb-config-settings'] = angular.toJson($scope.data);
    }, 1000);
}
