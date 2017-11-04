'use strict'

const path = require('path');
const mockFs = require('mock-fs');
const ProjectConfig = require('../../../lib/config/project-config');
const NodeConfig = require('../../../lib/config/node-config');
const NodeMaskConfig = require('../../../lib/config/node-mask-config');
const TaskConfig = require('../../../lib/config/task-config');
const ModeConfig = require('../../../lib/config/mode-config');
const ModuleConfig = require('../../../lib/config/module-config');

describe('config/project-config', function () {
    const projectRoot = path.resolve(__dirname);
    let projectConfig;

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
            const expectedEnvVariables = {};

            Object.keys(process.env).forEach(function (key) {
                expectedEnvVariables[key] = process.env[key];
            });

            expect(projectConfig.getEnvValues()).to.be.deep.equal(expectedEnvVariables);
        });
    });

    describe('getLanguages', function () {
        it('should return previously set languages', function () {
            const languages = ['en', 'ru'];

            projectConfig.setLanguages(languages);

            expect(projectConfig.getLanguages()).to.be.deep.equal(languages);
        });

        it('should return null if no languages were set', function () {
            expect(projectConfig.getLanguages()).to.be.null;
        });
    });

    describe('setLanguages', function () {
        it('should set languages', function () {
            const languages = ['en', 'ru'];

            projectConfig.setLanguages(languages);

            expect(projectConfig.getLanguages()).to.be.deep.equal(languages);
        });

        it('should support method chaining pattern', function () {
            const result = projectConfig.setLanguages();

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
            const sourcePath = 'path/to/level';
            const expectedResolvedPath = path.resolve(projectRoot, sourcePath);
            const result = projectConfig.resolvePath(sourcePath);

            expect(result).to.be.equal(expectedResolvedPath);
        });

        it('should resolve path passed as object with property path', function () {
            const sourcePath = { path: 'path/to/level' };
            const expectedResolvedPath = { path: path.resolve(projectRoot, sourcePath.path) };
            const result = projectConfig.resolvePath(sourcePath);

            expect(result).to.be.deep.equal(expectedResolvedPath);
        });
    });

    describe('node', function () {
        const nodePath = 'path/to/node';
        const configurator = function () {};

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
            const anotherConfigurator = function () {};
            let firstNodeConfig;
            let secondNodeConfig;

            projectConfig.node(nodePath, configurator);
            firstNodeConfig = projectConfig.getNodeConfig(nodePath);
            projectConfig.node(nodePath, anotherConfigurator);
            secondNodeConfig = projectConfig.getNodeConfig(nodePath);

            expect(firstNodeConfig).to.be.equal(secondNodeConfig);
        });

        it('should remove leading path separator from node path', function () {
            const modifiedNodePath = path.sep + nodePath;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should remove trailing path separator from node path', function () {
            const modifiedNodePath = nodePath + path.sep;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should remove leading and trailing path separators from node path', function () {
            const modifiedNodePath = path.sep + nodePath + path.sep;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should support method chaining pattern', function () {
            const result = projectConfig.node(nodePath, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('nodes', function () {
        const configurator = function () {};

        beforeEach(function () {
            const config = {};

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
            const nodePath = 'path/to/node';

            projectConfig.nodes(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as relative paths', function () {
            const nodePath = 'path/to/node';
            const anotherNodePath = 'path/to/another/node';

            projectConfig.nodes(nodePath, anotherNodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
            expect(projectConfig.getNodeConfig(anotherNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as array of relative paths', function () {
            const nodePath = 'path/to/node';
            const anotherNodePath = 'path/to/another/node';
            const paths = [nodePath, anotherNodePath];

            projectConfig.nodes(paths, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
            expect(projectConfig.getNodeConfig(anotherNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as shell mask, adding node configs as relative paths ' +
            'after resolving shell mask', function () {
            const nodeMask = '/*';
            const blocksNodePath = 'blocks'; // blocks and pages are directories in root of project fixture
            const pageNodePath = 'page';

            projectConfig.nodes(nodeMask, configurator);

            expect(projectConfig.getNodeConfig(blocksNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
            expect(projectConfig.getNodeConfig(pageNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed in mixed manner: as relative path, array of relative ' +
            'paths and shell mask', function () {
            const nodePath = 'path/to/node';
            const anotherNodePath = 'path/to/another/node';
            const blocksNodePath = 'blocks'; // blocks and pages are directories in root of project fixture
            const pageNodePath = 'page';
            const nodeMask = '/*';
            const pathsArray = [anotherNodePath];
            const expectedPath = [nodePath, anotherNodePath, blocksNodePath, pageNodePath];

            projectConfig.nodes(nodePath, pathsArray, nodeMask, configurator);

            expectedPath.forEach(function (expectedPath) {
                expect(projectConfig.getNodeConfig(expectedPath)).to.exist
                    .and.to.be.instanceOf(NodeConfig);
            });
        });

        it('should support method chaining pattern', function () {
            const nodePath = 'path/to/node';

            const result = projectConfig.nodes(nodePath, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('nodeMask', function () {
        const mask = /\w*bundles/g;
        const configurator = function () {};

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
            const anotherConfigurator = function () {};
            const expectedConfigsAmount = 2;

            projectConfig.nodeMask(mask, configurator);
            projectConfig.nodeMask(mask, anotherConfigurator);

            expect(projectConfig.getNodeMaskConfigs()).to.have.length(expectedConfigsAmount);
        });

        it('should support method chaining pattern', function () {
            const result = projectConfig.nodeMask(mask, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('task', function () {
        const taskName = 'test_task';
        const configurator = function () {};

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
            let firstTaskConfig;
            let secondTaskConfig;
            const anotherConfigurator = function () {};

            projectConfig.task(taskName, configurator);
            firstTaskConfig = projectConfig.getTaskConfig(taskName);
            projectConfig.task(taskName, anotherConfigurator);
            secondTaskConfig = projectConfig.getTaskConfig(taskName);

            expect(firstTaskConfig).to.be.equal(secondTaskConfig);
        });

        it('should support method chaining pattern', function () {
            const result = projectConfig.task(taskName, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('mode', function () {
        const modeName = 'test_mode';
        const configurator = function () {};

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
            let firstModeConfig;
            let secondModeConfig;
            const anotherConfigurator = function () {};

            projectConfig.mode(modeName, configurator);
            firstModeConfig = projectConfig.getModeConfig(modeName);
            projectConfig.mode(modeName, anotherConfigurator);
            secondModeConfig = projectConfig.getModeConfig(modeName);

            expect(firstModeConfig).to.be.equal(secondModeConfig);
        });

        it('should support method chaining pattern', function () {
            const result = projectConfig.mode(modeName, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('registerModule', function () {
        const moduleName = 'test_module';
        let moduleConfig;

        beforeEach(function () {
            moduleConfig = new ModuleConfig();
        });

        it('should register module', function () {
            projectConfig.registerModule(moduleName, moduleConfig);

            expect(projectConfig.module(moduleName)).to.be.equal(moduleConfig);
        });

        it('should not allow registering multiple modules for same name', function () {
            const anotherModuleConfig = new ModuleConfig();
            const expectedExcMessage = 'Module "' + moduleName + '" is already registered';
            const func = function () {
                projectConfig.registerModule(moduleName, moduleConfig);
                projectConfig.registerModule(moduleName, anotherModuleConfig);
            };

            expect(func).to.throw(expectedExcMessage);
        });

        it('should allow registering same module for different names', function () {
            const anotherModuleName = 'another_test_module';
            const func = function () {
                projectConfig.registerModule(moduleName, moduleConfig);
                projectConfig.registerModule(anotherModuleName, moduleConfig);
            };

            expect(func).to.not.throw();
        });
    });

    describe('module', function () {
        const moduleName = 'test_module';
        const configurator = function () {};
        let moduleConfig;

        beforeEach(function () {
            moduleConfig = new ModuleConfig();
            projectConfig.registerModule(moduleName, moduleConfig);
        });

        it('should add configurator to registered module', function () {
            projectConfig.module(moduleName, configurator);

            expect(projectConfig.module(moduleName)._chains).to.contain(configurator);
        });

        it('should throw error on attempt to configure non-registered module', function () {
            const nonRegisteredModuleName = 'non_registered_module';
            const expectedErrorMessage = 'Module "' + nonRegisteredModuleName + '" is not registered.';
            const func = function () { projectConfig.module(nonRegisteredModuleName, configurator); };

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
        const taskName = 'test_task';
        const configurator = function () {};

        it('should return tasks', function () {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(taskName);
        });
    });

    describe('getTaskConfig', function () {
        const taskName = 'test_task';
        const configurator = function () {};

        it('should return task config if it was added to project config', function () {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfig(taskName)).to.exist
                .and.to.be.instanceOf(TaskConfig);
        });

        it('should return undefined if task config is missing in project config', function () {
            const missedTaskName = 'missed_task';

            expect(projectConfig.getTaskConfig(missedTaskName)).to.be.undefined;
        });
    });

    describe('getModeConfigs', function () {
        const modeName = 'test_mode';
        const configurator = function () {};

        it('should return mode configs', function () {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(modeName);
        });
    });

    describe('getModeConfig', function () {
        const modeName = 'test_mode';
        const configurator = function () {};

        it('should return mode config if mode was added to project config', function () {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfig(modeName)).to.exist
                .and.to.be.instanceOf(ModeConfig);
        });

        it('should return undefined if mode was not added to project config', function () {
            const missedModeName = 'missed_mode';

            expect(projectConfig.getModeConfig(missedModeName)).to.be.undefined;
        });
    });

    describe('getNodeConfigs', function () {
        const nodePath = 'path/to/node';
        const configurator = function () {};

        it('should return node configs', function () {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(nodePath);
        });
    });

    describe('getNodeConfig', function () {
        const nodePath = 'path/to/node';
        const configurator = function () {};

        it('should return node config if it was added to project config', function () {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should return undefined if node config was not added for requested path', function () {
            const wrongNodePath = 'path/to/missing/node';

            expect(projectConfig.getNodeConfig(wrongNodePath)).to.be.undefined;
        });
    });

    describe('getNodeMaskConfigs', function () {
        const mask = /\w*bundles/g;
        const configurator = function () {};

        it('should return all node mask configs if no node path specified', function () {
            projectConfig.nodeMask(mask, configurator);

            expect(projectConfig.getNodeMaskConfigs()).to.be.instanceOf(Array)
                .and.to.have.length(1);
            expect(projectConfig.getNodeMaskConfigs()[0]).to.be.instanceOf(NodeMaskConfig);
        });

        it('should return mask config if it\'s mask matches with path', function () {
            const nodePath = 'path/to/desktop.bundles';
            const anotherMask = /\w*nodes/g;
            let result;

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
            const optionName = 'option_name';
            const optionValue = 'option_value';

            projectConfig.setEnv(optionName, optionValue);

            expect(projectConfig.getEnv(optionName)).to.be.equal(optionValue);
        });

        it('should return undefined if env option was not set', function () {
            const optionName = 'option_name';

            expect(projectConfig.getEnv(optionName)).to.be.undefined;
        });
    });

    describe('setEnv', function () {
        it('should set env variable passed as key and value strings', function () {
            const optionName = 'option_name';
            const optionValue = 'option_value';

            projectConfig.setEnv(optionName, optionValue);

            expect(projectConfig.getEnv(optionName)).to.be.equal(optionValue);
        });

        it('should set env variable value as undefined if only variable name provided', function () {
            const optionName = 'option_name';
            let env;

            projectConfig.setEnv(optionName);
            env = projectConfig.getEnvValues();

            expect(env).to.have.property(optionName);
            expect(env[optionName]).to.be.undefined;
        });

        it('should set env variables passed as env variables hash', function () {
            const options = {
                foo: 'bar',
                fizz: 'buzz'
            };
            let env;

            projectConfig.setEnv(options);
            env = projectConfig.getEnvValues();

            Object.keys(options).forEach(function (key) {
                expect(env).to.have.property(key, options[key]);
            });
        });
    });

    describe('getEnvValues', function () {
        it('should return env values', function () {
            const expectedEnv = {};
            let env;

            Object.keys(process.env).forEach(function (key) {
                expectedEnv[key] = process.env[key];
            });
            env = projectConfig.getEnvValues();

            expect(env).to.be.deep.equal(expectedEnv);
        });
    });

    describe('includeConfig', function () {
        const configPath = path.join(__dirname, '../../fixtures/project-configs/project-config.js');

        it('should resolve config path before using it', function () {
            const nonResolvedConfigPath = '../../fixtures/project-configs/project-config.js';
            const expectedPath = configPath;

            projectConfig.includeConfig(nonResolvedConfigPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.contain(expectedPath);
        });

        it('should require config file and execute it passing self', function () {
            projectConfig.includeConfig(configPath);

            expect(projectConfig.___xxx___).to.be.true;
        });

        it('should add included config filename to included config filenames', function () {
            projectConfig.includeConfig(configPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.contain(configPath);
        });

        it('should support method chaining pattern', function () {
            const result = projectConfig.includeConfig(configPath);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getIncludedConfigFilenames', function () {
        const configPath = path.join(__dirname, '../../fixtures/project-configs/project-config.js');

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
        const levelPath = 'level/path';
        const schemeBuilder = function () {};
        let resolvePathSpy;

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
            const expectedLevelNamingSchemeName = projectConfig.resolvePath(levelPath);

            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes())
                .to.have.property(expectedLevelNamingSchemeName, schemeBuilder);
        });

        it('should add level naming scheme to level naming schemes if level path passed as array', function () {
            const expectedLevelNamingSchemeName = projectConfig.resolvePath(levelPath);

            projectConfig.setLevelNamingScheme([levelPath], schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes())
                .to.have.property(expectedLevelNamingSchemeName, schemeBuilder);
        });

        it('should add multiple level naming schemes to level naming schemes if level paths passed as ' +
            'array', function () {
            const anotherLevelPath = 'another/level/path';
            const paths = [levelPath, anotherLevelPath];

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
            const absoluteLevelPath = '/' + levelPath;

            projectConfig.setLevelNamingScheme(absoluteLevelPath, schemeBuilder);

            expect(resolvePathSpy).to.be.not.called;
        });

        it('should support method chaining pattern', function () {
            const result = projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getLevelNamingSchemes', function () {
        it('should return level naming schemes', function () {
            const levelPath = 'level/path';
            const expectedLevelPath = projectConfig.resolvePath(levelPath);
            const schemeBuilder = function () {};

            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes()).to.be.instanceOf(Object)
                .and.to.have.property(expectedLevelPath, schemeBuilder);
        });
    });
});
