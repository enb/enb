'use strict'

const fs = require('fs');
const vow = require('vow');
const vowFs = require('vow-fs');
const mockFs = require('mock-fs');
const path = require('path');
const MakePlatform = require('../../../lib/make');
const NodeConfig = require('../../../lib/config/node-config');
const Node = require('../../../lib/node/node');
const ProjectConfig = require('../../../lib/config/project-config');
const ModeConfig = require('../../../lib/config/mode-config');
const Logger = require('../../../lib/logger');
const BuildGraph = require('../../../lib/ui/build-graph');
const CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/init', function () {
    let makePlatform;
    const sandbox = sinon.sandbox.create();

    beforeEach(function () {
        sandbox.stub(Node.prototype);
        sandbox.stub(ProjectConfig.prototype);

        sandbox.stub(vowFs, 'makeDir').returns(vow.fulfill()); // prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('mocked config directory tests', function () {
        beforeEach(function () {
            mockFs({});

            sandbox.stub(fs, 'existsSync').returns(true);
        });

        afterEach(function () {
            mockFs.restore();
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
            let nodeConfig;

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
                init_({ mode: null }); // null because need to implicitly call makePlatform.init without mode

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('test_mode');
                });
            });

            it('should set mode as development if no mode passed and no value available in ' +
                'process.env.YENV', function () {
                init_({ mode: null }); // null because need to implicitly call makePlatform.init without mode

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('development');
                });
            });

            it('should return promise on init call that resolves after all mode calls', function () {
                let resolved = false;

                ProjectConfig.prototype.getModeConfig.returns({
                    exec() {
                        return vow.delay('ok', 50).then(function () { resolved = true; });
                    }
                });

                makePlatform = new MakePlatform();
                return makePlatform.init('/path/to/project', 'mode', function () {}).then(function () {
                    resolved.should.be.true;
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

            it('should not create build graph by default', function () {
                init_();

                expect(makePlatform.getBuildGraph()).to.be.equal(null);
            });

            it('should create build graph on demand', function () {
                init_({ opts: { graph: true } });

                expect(makePlatform.getBuildGraph()).to.be.instanceOf(BuildGraph);
            });

            it('should initialize build graph with project name', function () {
                init_({ projectPath: '/path/to/project-name', opts: { graph: true } });

                expect(makePlatform.getBuildGraph().__constructor).to.be.calledWith('project-name');
            });
        });

        it('should execute config function if it passed', function () {
            const config = sinon.stub();

            init_({ config });

            expect(config).to.be.called;
        });

        it('should pass project config instance to config function', function () {
            const config = sinon.stub();

            init_({ config });

            expect(config).to.be.calledWith(makePlatform.getProjectConfig());
        });

        it('should return rejected promise if config function threw error', function () {
            const config = sinon.stub();
            config.throws(new Error('test_error'));

            return expect(init_({ config }))
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
            const modeConfig = sinon.createStubInstance(ModeConfig);
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
                    .to.be.deep.equal(new CacheStorage(path.normalize('/path/to/project/.enb/tmp/cache.json')));
            });
        });
    });

    describe('config loading from fs tests', function () {
        const ruConfigContents = 'module.exports = function(projectConfig) { projectConfig.setLanguages(["ru"]); };';
        const enConfigContents = 'module.exports = function(projectConfig) { projectConfig.setLanguages(["ru"]); };';
        const errorConfigContents = 'module.exports = function () { throw new Error("exc_in_config"); };';
        const errorPConfigContents = 'module.exports = function () { throw new Error("exc_in_personal_config"); };';

        afterEach(function () {
            mockFs.restore();
        });

        describe('regular config', function () {
            it('throw error if project directory does not have either .enb/ or .bem/ dirs', function () {
                const func = function () {
                    init_({
                        projectPath: '/path/to/project',
                        config: null // null because need to implicitly call makePlatform.init without configurator
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
                    '/path/to/project/.enb/make.js': ruConfigContents
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load config from .bem directory if it exists there', function () {
                mockFs({
                    '/path/to/project/.bem/make.js': ruConfigContents
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load config from .enb directory if both .enb and .bem dirs exists', function () {
                mockFs({
                    '/path/to/project': {
                        '.enb': { 'make.js': ruConfigContents },
                        '.bem': { 'make.js': enConfigContents }
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
                expect(makePlatform.getProjectConfig().setLanguages).to.be.not.calledWith(['en']);
            });

            it('should load enb-make.js config file if it exists', function () {
                mockFs({
                    '/path/to/project/.enb/enb-make.js': ruConfigContents
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load make.js config file if it exists', function () {
                mockFs({
                    '/path/to/project/.enb/make.js': ruConfigContents
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
            });

            it('should load enb-make.js config if both exist in config dir', function () {
                mockFs({
                    '/path/to/project/.enb': {
                        'make.js': enConfigContents,
                        'enb-make.js': ruConfigContents
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
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

                const initPromise = init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                return expect(initPromise)
                    .to.be.rejectedWith('Cannot find make configuration file.');
            });

            it('should drop require cache for for config file', function () {
                mockFs({
                    '/path/to/project/.enb/make.js': 'module.exports = function() {};'
                });

                return init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                }).then(function () {
                    mockFs({
                        '/path/to/project/.enb/make.js': ruConfigContents
                    });

                    return init_({
                        projectPath: '/path/to/project',
                        config: null // null because need to implicitly call makePlatform.init without configurator
                    });
                }).then(function () {
                    expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
                });
            });

            it('should return rejected promise if exception thrown while executing config', function () {
                mockFs({
                    '/path/to/project/.enb/make.js': errorConfigContents
                });

                const initPromise = init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                return expect(initPromise)
                    .to.be.rejectedWith('exc_in_config');
            });

            it('should pass project config instance to executed config', function () {
                mockFs({
                    '/path/to/project/.enb/make.js': ruConfigContents
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
            });
        });

        describe('personal config', function () {
            it('should load personal config using same rules with regular config loading', function () {
                mockFs({
                    '/path/to/project/.enb': {
                        'make.js': 'module.exports = function () {};',
                        'make.personal.js': ruConfigContents
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
            });

            it('should drop require cache for personal config', function () {
                mockFs({
                    '/path/to/project/.enb': {
                        'make.js': 'module.exports = function() {};',
                        'make.personal.js': 'module.exports = function() {};',
                    }
                });

                return init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                }).then(function () {
                    mockFs({
                        '/path/to/project/.enb': {
                            'make.js': 'module.exports = function() {};',
                            'make.personal.js': ruConfigContents
                        }
                    });

                    return init_({
                        projectPath: '/path/to/project',
                        config: null // null because need to implicitly call makePlatform.init without configurator
                    });
                }).then(function () {
                    expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWith(['ru']);
                });
            });

            it('should return rejected promise if exception thrown while executing personal config', function () {
                mockFs({
                    '/path/to/project/.enb': {
                        'make.js': 'module.exports = function () {};',
                        'make.personal.js': errorPConfigContents
                    }
                });

                const initPromise = init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                return expect(initPromise)
                    .to.be.rejectedWith('exc_in_personal_config');
            });

            it('should pass project config instance to executed personal config', function () {
                mockFs({
                    '/path/to/project/.enb': {
                        'make.js': 'module.exports = function () {};',
                        'make.personal.js': ruConfigContents
                    }
                });

                init_({
                    projectPath: '/path/to/project',
                    config: null // null because need to implicitly call makePlatform.init without configurator
                });

                expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
            });
        });
    });

    function init_(settings) {
        const defaults = {
            projectPath: '/default/project/path',
            mode: 'default_mode',
            config() {}
        };

        settings = Object.assign({}, defaults, settings);

        return makePlatform.init(
            settings.projectPath,
            settings.mode,
            settings.config,
            settings.opts
        );
    }
});
