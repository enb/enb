var vow = require('vow');
var vowFs = require('vow-fs');
var fs = require('fs');
var mockFs = require('mock-fs');
var path = require('path');
var _ = require('lodash');
var MakePlatform = require('../../../lib/make');
var NodeConfig = require('../../../lib/config/node-config');
var Node = require('../../../lib/node');
var ProjectConfig = require('../../../lib/config/project-config');
var ModeConfig = require('../../../lib/config/mode-config');
var Logger = require('../../../lib/logger');
var BuildGraph = require('../../../lib/ui/build-graph');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/init', function () {
    var makePlatform;
    var sandbox = sinon.sandbox.create();

    beforeEach(function () {
        sandbox.stub(vowFs);
        sandbox.stub(Node.prototype);
        sandbox.stub(ProjectConfig.prototype);

        vowFs.makeDir.returns(vow.fulfill()); //prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('mocked config directory tests', function () {
        beforeEach(function () {
            sandbox.stub(fs);
            fs.existsSync.returns(true);
        });

        it('should return promise', function () {
            expect(init_(makePlatform))
                .to.be.instanceOf(vow.Promise);
        });

        it('should set path to project', function () {
            init_({ projectPath: '/path/to/project' });

            expect(makePlatform.getDir()).to.be.equal('/path/to/project');
        });

        describe('mode tests', function () {
            var nodeConfig;

            beforeEach(function () {
                nodeConfig = sinon.createStubInstance(NodeConfig);
                ProjectConfig.prototype.getNodeConfig.returns(nodeConfig);
                ProjectConfig.prototype.getNodeMaskConfigs.returns([]);
            });

            afterEach(function () {
                delete process.env.YENV;
            });

            it('should set mode as mode passed in params', function () {
                init_({ mode: 'test_mode' });

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('test_mode');
                });
            });

            it('should set mode as value of process.env.YENV if no mode passed in params', function () {
                process.env.YENV = 'test_mode';
                init_({ mode: null }); //null because need to implicitly call makePlatform.init without mode

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('test_mode');
                });
            });

            it('should set mode as development if no mode passed and no value available in ' +
                'process.env.YENV', function () {
                init_({ mode: null }); //null because need to implicitly call makePlatform.init without mode

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('development');
                });
            });
        });

        it('should create project config', function () {
            init_();

            expect(makePlatform.getProjectConfig()).to.be.instanceOf(ProjectConfig);
        });

        it('should initialize project config with project dir', function () {
            init_({ projectPath: '/path/to/project' });

            expect(makePlatform.getProjectConfig().__constructor)
                .to.be.calledWith('/path/to/project');
        });

        it('should create logger', function () {
            init_();

            expect(makePlatform.getLogger()).to.be.instanceOf(Logger);
        });

        describe('build graph creation', function () {
            beforeEach(function () {
                sandbox.stub(BuildGraph.prototype);
            });

            it('should create build graph', function () {
                init_();

                expect(makePlatform.getBuildGraph()).to.be.instanceOf(BuildGraph);
            });

            it('should initialize build graph with project name', function () {
                init_({ projectPath: '/path/to/project-name' });

                expect(makePlatform.getBuildGraph().__constructor).to.be.calledWith('project-name');
            });
        });

        it('should execute config function if it passed', function () {
            var config = sinon.stub();

            init_({ config: config });

            expect(config).to.be.called;
        });

        it('should pass project config instance to config function', function () {
            var config = sinon.stub();

            init_({ config: config });

            expect(config).to.be.calledWith(makePlatform.getProjectConfig());
        });

        it('should return rejected promise if config function threw error', function () {
            var config = sinon.stub();
            config.throws('test_error');

            return expect(init_({ config: config }))
                .to.be.rejectedWith('test_error');
        });

        it('should load included configs from project config', function () {
            init_();

            expect(ProjectConfig.prototype.getIncludedConfigFilenames).to.be.called;
        });

        it('should load mode config from project config for make platform mode', function () {
            init_({ mode: 'test_mode' });

            expect(ProjectConfig.prototype.getModeConfig).to.be.calledWith('test_mode');
        });

        it('should execute mode config passing to it project config instance', function () {
            var modeConfig = sinon.createStubInstance(ModeConfig);
            ProjectConfig.prototype.getModeConfig.withArgs('test_mode').returns(modeConfig);

            init_({ mode: 'test_mode' });

            expect(modeConfig.exec).to.be.calledWith(sinon.match.any, makePlatform.getProjectConfig());
        });

        it('should save languages from project config', function () {
            ProjectConfig.prototype.getLanguages.returns(['ru']);

            init_();

            expect(makePlatform.getLanguages()).to.be.deep.equal(['ru']);
        });

        it('should save env values from project config', function () {
            ProjectConfig.prototype.getEnvValues.returns({ foo: 'bar' });

            init_();

            expect(makePlatform.getEnv()).to.be.deep.equal({ foo: 'bar' });
        });

        it('should save level naming schemes from project config', function () {
            ProjectConfig.prototype.getLevelNamingSchemes.returns({ foo: 'bar' });

            init_();

            expect(makePlatform.getLevelNamingScheme('foo')).to.be.equal('bar');
        });

        it('should submit clean task for project config', function () {
            init_();

            expect(ProjectConfig.prototype.task).to.be.calledWith('clean');
        });

        it('should create temp dir in .enb directory in project dir', function () {
            init_({ projectPath: '/path/to/project' });

            expect(vowFs.makeDir).to.be.calledWith(path.normalize('/path/to/project/.enb/tmp'));
        });

        it('should instantiate cache storage with path to cache file located in temp dir', function () {
            return init_({ projectPath: '/path/to/project' }).then(function () {
                expect(makePlatform.getCacheStorage())
                    .to.be.deep.equal(new CacheStorage(path.normalize('/path/to/project/.enb/tmp/cache.js')));
            });
        });
    });

    describe('config loading from fs tests', function () {
        var makeFileTemplate = _.template(
            'module.exports = function (projectConfig) { ' +
                'projectConfig.setLanguages(["${lang}"]); ' +
            '};'
        );

        afterEach(function () {
            mockFs.restore();
        });

        describe('regular config', function () {
            it('throw error if project directory does not have either .enb/ or .bem/ dirs', function () {
                var func = function () {
                    init_({
                        projectPath: '/path/to/project',
                        config: null //null because need to implicitly call makePlatform.init without configurator
                    });
                };

                mockFs({
                    '/path/to/project': {}
                });

                expect(func)
                    .to.throw('Cannot find enb config directory. Should be either .enb/ or .bem/.');
            });

            it('should load config from .enb directory if it exists there', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load config from .bem directory if it exists there', function () {
                mockFs({
                    '/path/to/project': {
                        '.bem': {
                            'make.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load config from .enb directory if both .enb and .bem dirs exists', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': makeFileTemplate({ lang: 'ru' })
                        },
                        '.bem': {
                            'make.js': makeFileTemplate({ lang: 'en' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
                expect(makePlatform.getProjectConfig().setLanguages).to.be.not.calledWith(['en']);
            });

            it('should load enb-make.js config file if it exists', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'enb-make.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load make.js config file if it exists', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load enb-make.js config if both exist in config dir', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': makeFileTemplate({ lang: 'en' }),
                            'enb-make.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
                expect(makePlatform.getProjectConfig().setLanguages).to.be.not.calledWith(['en']);
            });

            it('should return rejected promise if there is no config file in .enb and .bem directories', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {},
                        '.bem': {}
                    }
                });

                var initPromise = init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                return expect(initPromise)
                    .to.be.rejectedWith('Cannot find make configuration file.');
            });

            it('should drop require cache for for config file', function () {
                var modulePath = path.resolve('/path/to/project/.enb/make.js');
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });
                require.cache[modulePath] = 'foo';

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(require.cache[modulePath]).to.be.not.equal('foo');
            });

            it('should return rejected promise if exception thrown while executing config', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': 'module.exports = function () { ' +
                                            'throw new Error("exc_in_config");' +
                                       '};'
                        }
                    }
                });

                var initPromise = init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                return expect(initPromise)
                    .to.be.rejectedWith('exc_in_config');
            });

            it('should pass project config instance to executed config', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
            });
        });

        describe('personal config', function () {
            it('should load personal config using same rules with regular config loading', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': 'module.exports = function () {};', //will throw if no make file in dir
                            'make.personal.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
            });

            it('should drop require cache for personal config', function () {
                var modulePath = path.resolve('/path/to/project/.enb/make.personal.js');
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': 'module.exports = function () {};', //will throw if no make file in dir
                            'make.personal.js': 'module.exports = function () {};'
                        }
                    }
                });

                require.cache[modulePath] = 'foo';
                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(require.cache[modulePath]).to.be.not.equal('foo');
            });

            it('should return rejected promise if exception thrown while executing personal config', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': 'module.exports = function () {};', //will throw if no make file in dir
                            'make.personal.js': 'module.exports = function () { ' +
                                                    'throw new Error("exc_in_personal_config");' +
                                                '};'
                        }
                    }
                });

                var initPromise = init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                return expect(initPromise)
                    .to.be.rejectedWith('exc_in_personal_config');
            });

            it('should pass project config instance to executed personal config', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': {
                            'make.js': 'module.exports = function () {};', //will throw if no make file in dir
                            'make.personal.js': makeFileTemplate({ lang: 'ru' })
                        }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null //null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
            });
        });
    });

    function init_(settings) {
        settings = settings || {};

        _.defaults(settings, {
            projectPath: '/default/project/path',
            mode: 'default_mode',
            config: function () {}
        });

        return makePlatform.init(
            settings.projectPath,
            settings.mode,
            settings.config
        );
    }
});
