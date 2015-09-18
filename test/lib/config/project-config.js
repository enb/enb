var path = require('path');
var mockFs = require('mock-fs');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeConfig = require('../../../lib/config/node-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var TaskConfig = require('../../../lib/config/task-config');
var ModeConfig = require('../../../lib/config/mode-config');
var ModuleConfig = require('../../../lib/config/module-config');

describe('config/project-config', function () {
    var projectRoot = path.resolve('/project/root');
    var projectConfig;

    beforeEach(function () {
        projectConfig =  new ProjectConfig(projectRoot);
    });

    describe('constructor', function () {
        it('should set root path', function () {
            expect(projectConfig.getRootPath()).to.be.equal(projectRoot);
        });

        it('should create container for node configs', function () {
            expect(projectConfig.getNodeConfigs()).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for tasks', function () {
            expect(projectConfig.getTaskConfigs()).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('shoud create container for node mask configs', function () {
            expect(projectConfig.getNodeMaskConfigs()).to.exist
                .and.to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should define property for languages container', function () {
            expect(projectConfig).to.have.property('_languages');
        });

        it('should not create container for languages', function () {
            expect(projectConfig.getLanguages()).to.be.null;
        });

        it('should create container for level naming schemes', function () {
            expect(projectConfig.getLevelNamingSchemes()).to.exist
                .and.to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should create container for registering modules', function () {
            expect(projectConfig._modules).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for mode configs', function () {
            expect(projectConfig.getModeConfigs()).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should define container for environment variables', function () {
            expect(projectConfig.getEnvValues()).to.exist
                .and.to.be.instanceOf(Object);
        });

        it('should copy process environment variables to self environment variables container', function () {
            var expectedEnvVariables = {};

            Object.keys(process.env).forEach(function (key) {
                expectedEnvVariables[key] = process.env[key];
            });

            expect(projectConfig.getEnvValues()).to.be.deep.equal(expectedEnvVariables);
        });
    });

    describe('getLanguages', function () {
        it('should return previously set languages', function () {
            var languages = ['en', 'ru'];

            projectConfig.setLanguages(languages);

            expect(projectConfig.getLanguages()).to.be.deep.equal(languages);
        });

        it('should return null if no languages were set', function () {
            expect(projectConfig.getLanguages()).to.be.null;
        });
    });

    describe('setLanguages', function () {
        it('should set languages', function () {
            var languages = ['en', 'ru'];

            projectConfig.setLanguages(languages);

            expect(projectConfig.getLanguages()).to.be.deep.equal(languages);
        });

        it('should support method chaining pattern', function () {
            var result = projectConfig.setLanguages();

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getRootPath', function () {
        it('should return root path', function () {
            expect(projectConfig.getRootPath()).to.be.equal(projectRoot);
        });
    });

    describe('resolvePath', function () {
        it('should return root path if no path to resolve provided', function () {
            expect(projectConfig.resolvePath()).to.be.equal(projectRoot);
        });

        it('should resolve source path passed as string', function () {
            var sourcePath = 'path/to/level';
            var expectedResolvedPath = path.resolve(projectRoot, sourcePath);
            var result = projectConfig.resolvePath(sourcePath);

            expect(result).to.be.equal(expectedResolvedPath);
        });

        it('should resolve path passed as object with property path', function () {
            var sourcePath = { path: 'path/to/level' };
            var expectedResolvedPath = { path: path.resolve(projectRoot, sourcePath.path) };
            var result = projectConfig.resolvePath(sourcePath);

            expect(result).to.be.deep.equal(expectedResolvedPath);
        });
    });

    describe('node', function () {
        var nodePath = 'path/to/node';
        var configurator = function () {};

        it('should add node config to node configs', function () {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist;
        });

        it('should add node config to node configs as NodeConfig instance', function () {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.be.instanceOf(NodeConfig);
        });

        it('should add configurator to node config', function () {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)._chains).to.contain(configurator);
        });

        it('should not create new node config if adding multiple configurators for same node path', function () {
            var anotherConfigurator = function () {};
            var firstNodeConfig;
            var secondNodeConfig;

            projectConfig.node(nodePath, configurator);
            firstNodeConfig = projectConfig.getNodeConfig(nodePath);
            projectConfig.node(nodePath, anotherConfigurator);
            secondNodeConfig = projectConfig.getNodeConfig(nodePath);

            expect(firstNodeConfig).to.be.equal(secondNodeConfig);
        });

        it('should remove leading path separator from node path', function () {
            var modifiedNodePath = path.sep + nodePath;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should remove trailing path separator from node path', function () {
            var modifiedNodePath = nodePath + path.sep;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should remove leading and trailing path separators from node path', function () {
            var modifiedNodePath = path.sep + nodePath + path.sep;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should support method chaining pattern', function () {
            var result = projectConfig.node(nodePath, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('nodes', function () {
        var configurator = function () {};

        beforeEach(function () {
            var config = {};

            config[projectRoot] = {
                blocks: {},
                page: {}
            };

            mockFs(config);
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('should add configurator to node configs', function () {
            var nodePath = 'path/to/node';

            projectConfig.nodes(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as relative paths', function () {
            var nodePath = 'path/to/node';
            var anotherNodePath = 'path/to/another/node';

            projectConfig.nodes(nodePath, anotherNodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
            expect(projectConfig.getNodeConfig(anotherNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as array of relative paths', function () {
            var nodePath = 'path/to/node';
            var anotherNodePath = 'path/to/another/node';
            var paths = [nodePath, anotherNodePath];

            projectConfig.nodes(paths, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
            expect(projectConfig.getNodeConfig(anotherNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as shell mask, adding node configs as relative paths ' +
            'after resolving shell mask', function () {
            var nodeMask = '/*';
            var blocksNodePath = 'blocks'; //blocks and pages are directories in root of project fixture
            var pageNodePath = 'page';

            projectConfig.nodes(nodeMask, configurator);

            expect(projectConfig.getNodeConfig(blocksNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
            expect(projectConfig.getNodeConfig(pageNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed in mixed manner: as relative path, array of relative ' +
            'paths and shell mask', function () {
            var nodePath = 'path/to/node';
            var anotherNodePath = 'path/to/another/node';
            var blocksNodePath = 'blocks'; //blocks and pages are directories in root of project fixture
            var pageNodePath = 'page';
            var nodeMask = '/*';
            var pathsArray = [anotherNodePath];
            var expectedPath = [nodePath, anotherNodePath, blocksNodePath, pageNodePath];

            projectConfig.nodes(nodePath, pathsArray, nodeMask, configurator);

            expectedPath.forEach(function (expectedPath) {
                expect(projectConfig.getNodeConfig(expectedPath)).to.exist
                    .and.to.be.instanceOf(NodeConfig);
            });
        });

        it('should support method chaining pattern', function () {
            var nodePath = 'path/to/node';

            var result = projectConfig.nodes(nodePath, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('nodeMask', function () {
        var mask = /\w*bundles/g;
        var configurator = function () {};

        it('should add node mask config', function () {
            projectConfig.nodeMask(mask, configurator);

            expect(projectConfig.getNodeMaskConfigs()).to.have.length(1);
            expect(projectConfig.getNodeMaskConfigs()[0]).to.be.instanceOf(NodeMaskConfig);
        });

        it('should add configurator to created node mask config', function () {
            projectConfig.nodeMask(mask, configurator);

            expect(projectConfig.getNodeMaskConfigs()[0]._chains).to.contain(configurator);

        });

        it('should create different node mask configs for same masks', function () {
            var anotherConfigurator = function () {};
            var expectedConfigsAmount = 2;

            projectConfig.nodeMask(mask, configurator);
            projectConfig.nodeMask(mask, anotherConfigurator);

            expect(projectConfig.getNodeMaskConfigs()).to.have.length(expectedConfigsAmount);
        });

        it('should support method chaining pattern', function () {
            var result = projectConfig.nodeMask(mask, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('task', function () {
        var taskName = 'test_task';
        var configurator = function () {};

        it('should add task config', function () {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfig(taskName)).to.exist
                .and.to.be.instanceOf(TaskConfig);
        });

        it('should add configurator to created task config', function () {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfig(taskName)._chains).to.contain(configurator);
        });

        it('should not create new task config if adding multiple configurators for same task name', function () {
            var firstTaskConfig;
            var secondTaskConfig;
            var anotherConfigurator = function () {};

            projectConfig.task(taskName, configurator);
            firstTaskConfig = projectConfig.getTaskConfig(taskName);
            projectConfig.task(taskName, anotherConfigurator);
            secondTaskConfig = projectConfig.getTaskConfig(taskName);

            expect(firstTaskConfig).to.be.equal(secondTaskConfig);
        });

        it('should support method chaining pattern', function () {
            var result = projectConfig.task(taskName, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('mode', function () {
        var modeName = 'test_mode';
        var configurator = function () {};

        it('should add mode config', function () {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfig(modeName)).to.exist
                .and.to.be.instanceOf(ModeConfig);
        });

        it('should add configurator to created mode config', function () {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfig(modeName)._chains).to.contain(configurator);
        });

        it('should not create new mode config if adding multiple configurators for same mode name', function () {
            var firstModeConfig;
            var secondModeConfig;
            var anotherConfigurator = function () {};

            projectConfig.mode(modeName, configurator);
            firstModeConfig = projectConfig.getModeConfig(modeName);
            projectConfig.mode(modeName, anotherConfigurator);
            secondModeConfig = projectConfig.getModeConfig(modeName);

            expect(firstModeConfig).to.be.equal(secondModeConfig);
        });

        it('should support method chaining pattern', function () {
            var result = projectConfig.mode(modeName, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('registerModule', function () {
        var moduleName = 'test_module';
        var moduleConfig;

        beforeEach(function () {
            moduleConfig = new ModuleConfig();
        });

        it('should register module', function () {
            projectConfig.registerModule(moduleName, moduleConfig);

            expect(projectConfig.module(moduleName)).to.be.equal(moduleConfig);
        });

        it('should not allow registering multiple modules for same name', function () {
            var anotherModuleConfig = new ModuleConfig();
            var expectedExcMessage = 'Module "' + moduleName + '" is already registered';
            var func = function () {
                projectConfig.registerModule(moduleName, moduleConfig);
                projectConfig.registerModule(moduleName, anotherModuleConfig);
            };

            expect(func).to.throw(expectedExcMessage);
        });

        it('should allow registering same module for different names', function () {
            var anotherModuleName = 'another_test_module';
            var func = function () {
                projectConfig.registerModule(moduleName, moduleConfig);
                projectConfig.registerModule(anotherModuleName, moduleConfig);
            };

            expect(func).to.not.throw();
        });
    });

    describe('module', function () {
        var moduleName = 'test_module';
        var configurator = function () {};
        var moduleConfig;

        beforeEach(function () {
            moduleConfig = new ModuleConfig();
            projectConfig.registerModule(moduleName, moduleConfig);
        });

        it('should add configurator to registered module', function () {
            projectConfig.module(moduleName, configurator);

            expect(projectConfig.module(moduleName)._chains).to.contain(configurator);
        });

        it('should throw error on attempt to configure non-registered module', function () {
            var nonRegisteredModuleName = 'non_registered_module';
            var expectedErrorMessage = 'Module "' + nonRegisteredModuleName + '" is not registered.';
            var func = function () { projectConfig.module(nonRegisteredModuleName, configurator); };

            expect(func).to.throw(expectedErrorMessage);
        });

        it('should return module if configurator is not provided', function () {
            expect(projectConfig.module(moduleName)).to.be.equal(moduleConfig);
        });

        it('should return self if configurator provided', function () {
            expect(projectConfig.module(moduleName, configurator)).to.be.equal(projectConfig);
        });
    });

    describe('getTaskConfigs', function () {
        var taskName = 'test_task';
        var configurator = function () {};

        it('should return tasks', function () {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(taskName);
        });
    });

    describe('getTaskConfig', function () {
        var taskName = 'test_task';
        var configurator = function () {};

        it('should return task config if it was added to project config', function () {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfig(taskName)).to.exist
                .and.to.be.instanceOf(TaskConfig);
        });

        it('should return undefined if task config is missing in project config', function () {
            var missedTaskName = 'missed_task';

            expect(projectConfig.getTaskConfig(missedTaskName)).to.be.undefined;
        });
    });

    describe('getModeConfigs', function () {
        var modeName = 'test_mode';
        var configurator = function () {};

        it('should return mode configs', function () {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(modeName);
        });
    });

    describe('getModeConfig', function () {
        var modeName = 'test_mode';
        var configurator = function () {};

        it('should return mode config if mode was added to project config', function () {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfig(modeName)).to.exist
                .and.to.be.instanceOf(ModeConfig);
        });

        it('should return undefined if mode was not added to project config', function () {
            var missedModeName = 'missed_mode';

            expect(projectConfig.getModeConfig(missedModeName)).to.be.undefined;
        });
    });

    describe('getNodeConfigs', function () {
        var nodePath = 'path/to/node';
        var configurator = function () {};

        it('should return node configs', function () {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(nodePath);
        });
    });

    describe('getNodeConfig', function () {
        var nodePath = 'path/to/node';
        var configurator = function () {};

        it('should return node config if it was added to project config', function () {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should return undefined if node config was not added for requested path', function () {
            var wrongNodePath = 'path/to/missing/node';

            expect(projectConfig.getNodeConfig(wrongNodePath)).to.be.undefined;
        });
    });

    describe('getNodeMaskConfigs', function () {
        var mask = /\w*bundles/g;
        var configurator = function () {};

        it('should return all node mask configs if no node path specified', function () {
            projectConfig.nodeMask(mask, configurator);

            expect(projectConfig.getNodeMaskConfigs()).to.be.instanceOf(Array)
                .and.to.have.length(1);
            expect(projectConfig.getNodeMaskConfigs()[0]).to.be.instanceOf(NodeMaskConfig);
        });

        it('should return mask config if it\'s mask matches with path', function () {
            var nodePath = 'path/to/desktop.bundles';
            var anotherMask = /\w*nodes/g;
            var result;

            projectConfig.nodeMask(mask, configurator);
            projectConfig.nodeMask(anotherMask, configurator);
            result = projectConfig.getNodeMaskConfigs(nodePath);

            expect(result).to.be.instanceOf(Array)
                .and.to.have.length(1);
            expect(result[0]).to.be.instanceOf(NodeMaskConfig);
            expect(result[0].getMask()).to.be.equal(mask);
        });
    });

    describe('getEnv', function () {
        it('should return env option if it was set', function () {
            var optionName = 'option_name';
            var optionValue = 'option_value';

            projectConfig.setEnv(optionName, optionValue);

            expect(projectConfig.getEnv(optionName)).to.be.equal(optionValue);
        });

        it('should return undefined if env option was not set', function () {
            var optionName = 'option_name';

            expect(projectConfig.getEnv(optionName)).to.be.undefined;
        });
    });

    describe('setEnv', function () {
        it('should set env variable passed as key and value strings', function () {
            var optionName = 'option_name';
            var optionValue = 'option_value';

            projectConfig.setEnv(optionName, optionValue);

            expect(projectConfig.getEnv(optionName)).to.be.equal(optionValue);
        });

        it('should set env variable value as undefined if only variable name provided', function () {
            var optionName = 'option_name';
            var env;

            projectConfig.setEnv(optionName);
            env = projectConfig.getEnvValues();

            expect(env).to.have.property(optionName);
            expect(env[optionName]).to.be.undefined;
        });

        it('should set env variables passed as env variables hash', function () {
            var options = {
                foo: 'bar',
                fizz: 'buzz'
            };
            var env;

            projectConfig.setEnv(options);
            env = projectConfig.getEnvValues();

            Object.keys(options).forEach(function (key) {
                expect(env).to.have.property(key, options[key]);
            });
        });
    });

    describe('getEnvValues', function () {
        it('should return env values', function () {
            var expectedEnv = {};
            var env;

            Object.keys(process.env).forEach(function (key) {
                expectedEnv[key] = process.env[key];
            });
            env = projectConfig.getEnvValues();

            expect(env).to.be.deep.equal(expectedEnv);
        });
    });

    describe('includeConfig', function () {
        var configPath = path.join(__dirname, '../../fixtures/project-configs/project-config.js');

        it('should resolve config path before using it', function () {
            var nonResolvedConfigPath = '../../test/fixtures/project-configs/project-config.js';
            var expectedPath = configPath;

            projectConfig.includeConfig(nonResolvedConfigPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.contain(expectedPath);
        });

        it('should drop require cache for config file before including it', function () {
            var expectedModule = { foo: 'bar' };
            require.cache[configPath] = expectedModule;

            projectConfig.includeConfig(configPath);

            expect(require.cache[configPath]).to.exist
                .and.to.be.not.equal(expectedModule);
        });

        it('should require config file and execute it passing self', function () {
            projectConfig.includeConfig(configPath);

            expect(require(configPath).lastCallParam).to.exist
                .and.to.be.equal(projectConfig);
        });

        it('should add included config filename to included config filenames', function () {
            projectConfig.includeConfig(configPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.contain(configPath);
        });

        it('should support method chaining pattern', function () {
            var result = projectConfig.includeConfig(configPath);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getIncludedConfigFilenames', function () {
        var configPath = path.join(__dirname, '../../fixtures/project-configs/project-config.js');

        it('should return array containing included config filenames if any configs were included', function () {
            projectConfig.includeConfig(configPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.be.instanceOf(Array)
                .and.to.have.length(1)
                .and.to.contain(configPath);
        });

        it('should return empty array if no configs were included', function () {
            expect(projectConfig.getIncludedConfigFilenames()).to.be.instanceOf(Array)
                .and.to.be.empty;
        });
    });

    describe('setLevelNamingScheme', function () {
        var levelPath = 'level/path';
        var schemeBuilder = function () {};
        var resolvePathSpy;

        beforeEach(function () {
            resolvePathSpy = new sinon.spy(projectConfig, 'resolvePath');
        });

        afterEach(function () {
            resolvePathSpy.reset();
        });

        after(function () {
            resolvePathSpy.restore();
        });

        it('should add level naming scheme to level naming schemes if level path passed as string', function () {
            var expectedLevelNamingSchemeName = projectConfig.resolvePath(levelPath);

            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes())
                .to.have.property(expectedLevelNamingSchemeName, schemeBuilder);
        });

        it('should add level naming scheme to level naming schemes if level path passed as array', function () {
            var expectedLevelNamingSchemeName = projectConfig.resolvePath(levelPath);

            projectConfig.setLevelNamingScheme([levelPath], schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes())
                .to.have.property(expectedLevelNamingSchemeName, schemeBuilder);
        });

        it('should add multiple level naming schemes to level naming schemes if level paths passed as ' +
            'array', function () {
            var anotherLevelPath = 'another/level/path';
            var paths = [levelPath, anotherLevelPath];

            projectConfig.setLevelNamingScheme(paths, schemeBuilder);

            paths.forEach(function (levelPath) {
                expect(projectConfig.getLevelNamingSchemes())
                    .to.have.property(projectConfig.resolvePath(levelPath), schemeBuilder);
            });
        });

        it('should resolve relative level path', function () {
            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(resolvePathSpy).to.be.calledWith(levelPath);
        });

        it('should not resolve absolute level path', function () {
            var absoluteLevelPath = '/' + levelPath;

            projectConfig.setLevelNamingScheme(absoluteLevelPath, schemeBuilder);

            expect(resolvePathSpy).to.be.not.called;
        });

        it('should support method chaining pattern', function () {
            var result = projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getLevelNamingSchemes', function () {
        it('should return level naming schemes', function () {
            var levelPath = 'level/path';
            var expectedLevelPath = projectConfig.resolvePath(levelPath);
            var schemeBuilder = function () {};

            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes()).to.be.instanceOf(Object)
                .and.to.have.property(expectedLevelPath, schemeBuilder);
        });
    });
});
