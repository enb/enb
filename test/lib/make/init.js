var vow = require('vow');
var vowFs = require('vow-fs');
var fs = require('fs');
var mockFs = require('mock-fs');
var path = require('path');
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

    beforeEach(function () {
        vowFs.makeDir = sinon.stub();
        vowFs.makeDir.returns(vow.fulfill());

        sinon.sandbox.stub(Node.prototype);
        sinon.sandbox.stub(ProjectConfig.prototype);

        makePlatform = new MakePlatform();
    });

    afterEach(function () {
        sinon.sandbox.restore();
    });

    describe('mocked config directory tests', function () {
        beforeEach(function () {
            sinon.sandbox.stub(fs);
            fs.existsSync.returns(true);
        });

        it('should return promise', function () {
            expect(makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {}))
                .to.be.instanceOf(vow.Promise);
        });

        it('should set path to project', function () {
            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(makePlatform.getDir()).to.be.equal(path.normalize('/path/to/project'));
        });

        describe('mode tests', function () {
            var nodeConfig;

            beforeEach(function () {
                nodeConfig = sinon.createStubInstance(NodeConfig);
                ProjectConfig.prototype.getNodeConfig.returns(nodeConfig);
                ProjectConfig.prototype.getNodeMaskConfigs.returns([]);
            });

            it('should set mode as mode passed in params', function () {
                makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('test_mode');
                });
            });

            it('should set mode as value of process.env.YENV if no mode passed in params', function () {
                process.env.YENV = 'test_mode';

                makePlatform.init(path.normalize('/path/to/project'), undefined, function () {});

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('test_mode');
                });
            });

            it('should set mode as development if no mode passed and no value available in ' +
                'process.env.YENV', function () {
                delete process.env.YENV;

                makePlatform.init(path.normalize('/path/to/project'), undefined, function () {});

                return makePlatform.initNode('path/to/node').then(function () {
                    expect(nodeConfig.getModeConfig).to.be.calledWith('development');
                });
            });
        });

        it('should create project config', function () {
            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(makePlatform.getProjectConfig()).to.be.instanceOf(ProjectConfig);
        });

        it('should initialize project config with project dir', function () {
            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(makePlatform.getProjectConfig().__constructor)
                .to.be.calledWith(path.normalize('/path/to/project'));
        });

        it('should create logger', function () {
            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(makePlatform.getLogger()).to.be.instanceOf(Logger);
        });

        describe('build graph creation', function () {
            beforeEach(function () {
                sinon.sandbox.stub(BuildGraph.prototype);
            });

            it('should create build graph', function () {
                makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

                expect(makePlatform.getBuildGraph()).to.be.instanceOf(BuildGraph);
            });

            it('should initialize build graph with project name', function () {
                makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

                expect(makePlatform.getBuildGraph().__constructor).to.be.calledWith('project');
            });
        });

        it('should execute config function if it passed', function () {
            var config = sinon.stub();

            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', config);

            expect(config).to.be.called;
        });

        it('should pass project config instance to config function', function () {
            var config = sinon.stub();

            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', config);

            expect(config).to.be.calledWith(makePlatform.getProjectConfig());
        });

        it('should return rejected promise if config function threw error', function () {
            var config = sinon.stub();
            config.throws('test_error');

            return expect(makePlatform.init(path.normalize('/path/to/project'), 'test_mode', config))
                .to.be.rejectedWith('test_error');
        });

        it('should load included configs from project config', function () {
            makePlatform.init(path.normalize('/path/to/project'), null, function () {});

            expect(ProjectConfig.prototype.getIncludedConfigFilenames).to.be.called;
        });

        it('should load mode config from project config for make platform mode', function () {
            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(ProjectConfig.prototype.getModeConfig).to.be.calledWith('test_mode');
        });

        it('should execute mode config passing to it project config instance', function () {
            var modeConfig = sinon.createStubInstance(ModeConfig);
            ProjectConfig.prototype.getModeConfig.withArgs('test_mode').returns(modeConfig);

            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(modeConfig.exec).to.be.calledWith(sinon.match.any, makePlatform.getProjectConfig());
        });

        it('should save languages from project config', function () {
            ProjectConfig.prototype.getLanguages.returns(['ru']);

            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(makePlatform.getLanguages()).to.be.deep.equal(['ru']);
        });

        it('should save env values from project config', function () {
            ProjectConfig.prototype.getEnvValues.returns({ foo: 'bar' });

            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(makePlatform.getEnv()).to.be.deep.equal({ foo: 'bar' });
        });

        it('should save level naming schemes from project config', function () {
            ProjectConfig.prototype.getLevelNamingSchemes.returns({ foo: 'bar' });

            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(makePlatform.getLevelNamingScheme('foo')).to.be.equal('bar');
        });

        it('should submit clean task for project config', function () {
            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(ProjectConfig.prototype.task).to.be.calledWith('clean');
        });

        it('should create temp dir in .enb directory in project dir', function () {
            makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {});

            expect(vowFs.makeDir).to.be.calledWith(path.normalize('/path/to/project/.enb/tmp'));
        });

        it('should instantiate cache storage with path to cache file located in temp dir', function () {
            return makePlatform.init(path.normalize('/path/to/project'), 'test_mode', function () {}).then(function () {
                expect(makePlatform.getCacheStorage())
                    .to.be.deep.equal(new CacheStorage(path.normalize('/path/to/project/.enb/tmp/cache.js')));
            });
        });
    });

    describe('config loading from fs tests', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('throw error if project directory does not have either .enb/ or .bem/ dirs', function () {
            mockFs({
                '/path/to/project': {}
            });

            expect(function () { makePlatform.init(path.normalize('/path/to/project')); })
                .to.throw('Cannot find enb config directory. Should be either .enb/ or .bem/.');
        });

        it('should load config from .enb directory if it exists there', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'var normalize = require("path").normalize;' +
                                   'require("fs").writeFileSync(normalize("/path/to/project/.enb/loaded.config"));' +
                                   'module.exports = function () { return "---1" };'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'), undefined, undefined);

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/loaded.config'))).to.be.true;
        });

        it('should load config from .bem directory if it exists there', function () {
            mockFs({
                '/path/to/project': {
                    '.bem': {
                        'make.js': 'var normalize = require("path").normalize;' +
                                   'require("fs").writeFileSync(normalize("/path/to/project/.bem/loaded.config"));' +
                                   'module.exports = function () {};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.bem/loaded.config'))).to.be.true;
        });

        it('should load config from .enb directory if both .enb and .bem dirs exists', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'var normalize = require("path").normalize;' +
                                   'require("fs").writeFileSync(normalize("/path/to/project/.enb/enb.config"));' +
                                   'module.exports = function () {};'
                    },
                    '.bem': {
                        'make.js': 'var normalize = require("path").normalize;' +
                                   'require("fs").writeFileSync(normalize("/path/to/project/.bem/bem.config"));' +
                                   'module.exports = function () {};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/enb.config'))).to.be.true;
            expect(fs.existsSync(path.normalize('/path/to/project/.bem/bem.config'))).to.be.false;
        });

        it('should load enb-make.js config file if it exists', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'enb-make.js': 'var normalize = require("path").normalize;' +
                                       'require("fs").writeFileSync(normalize("/path/to/project/.enb/loaded.conf"));' +
                                       'module.exports = function () {};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/loaded.conf'))).to.be.true;
        });

        it('should load make.js config file if it exists', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'var normalize = require("path").normalize;' +
                        'require("fs").writeFileSync(normalize("/path/to/project/.enb/loaded.config"));' +
                        'module.exports = function () {};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/loaded.config'))).to.be.true;
        });

        it('should load enb-make.js config if both exist in config dir', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'var normalize = require("path").normalize;' +
                                   'require("fs").writeFileSync(normalize("/path/to/project/.enb/make.config"));' +
                                   'module.exports = function () {};',
                        'enb-make.js': 'var fs = require("fs");' +
                                       'var normalize = require("path").normalize;' +
                                       'fs.writeFileSync(normalize("/path/to/project/.enb/enb-make.config"));' +
                                       'module.exports = function () {};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/enb-make.config'))).to.be.true;
            expect(fs.existsSync(path.normalize('/path/to/project/.enb/make.config'))).to.be.false;
        });

        it('should return rejected promise if there is no config file in .enb and .bem directories', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {},
                    '.bem': {}
                }
            });

            return expect(makePlatform.init(path.normalize('/path/to/project')))
                .to.be.rejectedWith('Cannot find make configuration file.');
        });

        it('should drop require cache for for config file', function () {
            var modulePath = path.resolve('/path/to/project/.enb/make.js');
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'module.exports = function () {};'
                    }
                }
            });
            require.cache[modulePath] = 'foo';

            makePlatform.init(path.normalize('/path/to/project'));

            expect(require.cache[modulePath]).to.be.not.equal('foo');
        });

        it('should execute loaded config', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'var normalize = require("path").normalize;' +
                                   'module.exports = function () { ' +
                                       'require("fs").writeFileSync(normalize("/path/to/project/.enb/exec.config"));' +
                                   '};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/exec.config'))).to.be.true;
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

            return expect(makePlatform.init(path.normalize('/path/to/project')))
                .to.be.rejectedWith('exc_in_config');
        });

        it('should pass project config instance to executed config', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'module.exports = function (projectConfig) { ' +
                                       'projectConfig.setLanguages(["ru"]);' +
                                   '};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
        });

        it('should load personal config using same rules with regular config loading', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'module.exports = function () {};', //will throw if no make file in dir
                        'make.personal.js': 'var normalize = require("path").normalize;' +
                                'require("fs").writeFileSync(normalize("/path/to/project/.enb/loaded.config"));' +
                                'module.exports = function () {};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/loaded.config'))).to.be.true;
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
            makePlatform.init(path.normalize('/path/to/project'));

            expect(require.cache[modulePath]).to.be.not.equal('foo');
        });

        it('should execute personal config', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'module.exports = function () {};', //will throw if no make file in dir
                        'make.personal.js': 'var normalize = require("path").normalize;' +
                            'module.exports = function () { ' +
                                'require("fs").writeFileSync(normalize("/path/to/project/.enb/loaded.executed")); ' +
                            '};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(fs.existsSync(path.normalize('/path/to/project/.enb/loaded.executed'))).to.be.true;
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

            return expect(makePlatform.init(path.normalize('/path/to/project')))
                .to.be.rejectedWith('exc_in_personal_config');
        });

        it('should pass project config instance to executed personal config', function () {
            mockFs({
                '/path/to/project': {
                    '.enb': {
                        'make.js': 'module.exports = function () {};', //will throw if no make file in dir
                        'make.personal.js': 'module.exports = function (projectConfig) { ' +
                                               'projectConfig.setLanguages(["ru"]);' +
                                            '};'
                    }
                }
            });

            makePlatform.init(path.normalize('/path/to/project'));

            expect(makePlatform.getProjectConfig().setLanguages).to.be.calledWithMatch(['ru']);
        });
    });
});
