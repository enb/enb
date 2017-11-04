'use strict'

const path = require('path');
const mockFs = require('mock-fs');
const ProjectConfig = require('../../../lib/config/project-config');
const NodeConfig = require('../../../lib/config/node-config');
const NodeMaskConfig = require('../../../lib/config/node-mask-config');
const TaskConfig = require('../../../lib/config/task-config');
const ModeConfig = require('../../../lib/config/mode-config');
const ModuleConfig = require('../../../lib/config/module-config');

describe('config/project-config', () => {
    const projectRoot = path.resolve(__dirname);
    let projectConfig;

    beforeEach(() => {
        projectConfig =  new ProjectConfig(projectRoot);
    });

    describe('constructor', () => {
        it('should set root path', () => {
            expect(projectConfig.getRootPath()).to.be.equal(projectRoot);
        });

        it('should create container for node configs', () => {
            expect(projectConfig.getNodeConfigs()).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for tasks', () => {
            expect(projectConfig.getTaskConfigs()).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('shoud create container for node mask configs', () => {
            expect(projectConfig.getNodeMaskConfigs()).to.exist
                .and.to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should define property for languages container', () => {
            expect(projectConfig).to.have.property('_languages');
        });

        it('should not create container for languages', () => {
            expect(projectConfig.getLanguages()).to.be.null;
        });

        it('should create container for level naming schemes', () => {
            expect(projectConfig.getLevelNamingSchemes()).to.exist
                .and.to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should create container for registering modules', () => {
            expect(projectConfig._modules).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for mode configs', () => {
            expect(projectConfig.getModeConfigs()).to.exist
                .and.to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should define container for environment variables', () => {
            expect(projectConfig.getEnvValues()).to.exist
                .and.to.be.instanceOf(Object);
        });

        it('should copy process environment variables to self environment variables container', () => {
            const expectedEnvVariables = {};

            Object.keys(process.env).forEach(key => {
                expectedEnvVariables[key] = process.env[key];
            });

            expect(projectConfig.getEnvValues()).to.be.deep.equal(expectedEnvVariables);
        });
    });

    describe('getLanguages', () => {
        it('should return previously set languages', () => {
            const languages = ['en', 'ru'];

            projectConfig.setLanguages(languages);

            expect(projectConfig.getLanguages()).to.be.deep.equal(languages);
        });

        it('should return null if no languages were set', () => {
            expect(projectConfig.getLanguages()).to.be.null;
        });
    });

    describe('setLanguages', () => {
        it('should set languages', () => {
            const languages = ['en', 'ru'];

            projectConfig.setLanguages(languages);

            expect(projectConfig.getLanguages()).to.be.deep.equal(languages);
        });

        it('should support method chaining pattern', () => {
            const result = projectConfig.setLanguages();

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getRootPath', () => {
        it('should return root path', () => {
            expect(projectConfig.getRootPath()).to.be.equal(projectRoot);
        });
    });

    describe('resolvePath', () => {
        it('should return root path if no path to resolve provided', () => {
            expect(projectConfig.resolvePath()).to.be.equal(projectRoot);
        });

        it('should resolve source path passed as string', () => {
            const sourcePath = 'path/to/level';
            const expectedResolvedPath = path.resolve(projectRoot, sourcePath);
            const result = projectConfig.resolvePath(sourcePath);

            expect(result).to.be.equal(expectedResolvedPath);
        });

        it('should resolve path passed as object with property path', () => {
            const sourcePath = { path: 'path/to/level' };
            const expectedResolvedPath = { path: path.resolve(projectRoot, sourcePath.path) };
            const result = projectConfig.resolvePath(sourcePath);

            expect(result).to.be.deep.equal(expectedResolvedPath);
        });
    });

    describe('node', () => {
        const nodePath = 'path/to/node';
        const configurator = () => {};

        it('should add node config to node configs', () => {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist;
        });

        it('should add node config to node configs as NodeConfig instance', () => {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.be.instanceOf(NodeConfig);
        });

        it('should add configurator to node config', () => {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)._chains).to.contain(configurator);
        });

        it('should not create new node config if adding multiple configurators for same node path', () => {
            const anotherConfigurator = () => {};
            let firstNodeConfig;
            let secondNodeConfig;

            projectConfig.node(nodePath, configurator);
            firstNodeConfig = projectConfig.getNodeConfig(nodePath);
            projectConfig.node(nodePath, anotherConfigurator);
            secondNodeConfig = projectConfig.getNodeConfig(nodePath);

            expect(firstNodeConfig).to.be.equal(secondNodeConfig);
        });

        it('should remove leading path separator from node path', () => {
            const modifiedNodePath = path.sep + nodePath;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should remove trailing path separator from node path', () => {
            const modifiedNodePath = nodePath + path.sep;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should remove leading and trailing path separators from node path', () => {
            const modifiedNodePath = path.sep + nodePath + path.sep;

            projectConfig.node(modifiedNodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.have.property(nodePath);
        });

        it('should support method chaining pattern', () => {
            const result = projectConfig.node(nodePath, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('nodes', () => {
        const configurator = () => {};

        beforeEach(() => {
            const config = {};

            config[projectRoot] = {
                blocks: {},
                page: {}
            };

            mockFs(config);
        });

        afterEach(() => {
            mockFs.restore();
        });

        it('should add configurator to node configs', () => {
            const nodePath = 'path/to/node';

            projectConfig.nodes(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as relative paths', () => {
            const nodePath = 'path/to/node';
            const anotherNodePath = 'path/to/another/node';

            projectConfig.nodes(nodePath, anotherNodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
            expect(projectConfig.getNodeConfig(anotherNodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should add node configs for multiple paths passed as array of relative paths', () => {
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
            'after resolving shell mask', () => {
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
            'paths and shell mask', () => {
            const nodePath = 'path/to/node';
            const anotherNodePath = 'path/to/another/node';
            const blocksNodePath = 'blocks'; // blocks and pages are directories in root of project fixture
            const pageNodePath = 'page';
            const nodeMask = '/*';
            const pathsArray = [anotherNodePath];
            const expectedPath = [nodePath, anotherNodePath, blocksNodePath, pageNodePath];

            projectConfig.nodes(nodePath, pathsArray, nodeMask, configurator);

            expectedPath.forEach(expectedPath => {
                expect(projectConfig.getNodeConfig(expectedPath)).to.exist
                    .and.to.be.instanceOf(NodeConfig);
            });
        });

        it('should support method chaining pattern', () => {
            const nodePath = 'path/to/node';

            const result = projectConfig.nodes(nodePath, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('nodeMask', () => {
        const mask = /\w*bundles/g;
        const configurator = () => {};

        it('should add node mask config', () => {
            projectConfig.nodeMask(mask, configurator);

            expect(projectConfig.getNodeMaskConfigs()).to.have.length(1);
            expect(projectConfig.getNodeMaskConfigs()[0]).to.be.instanceOf(NodeMaskConfig);
        });

        it('should add configurator to created node mask config', () => {
            projectConfig.nodeMask(mask, configurator);

            expect(projectConfig.getNodeMaskConfigs()[0]._chains).to.contain(configurator);
        });

        it('should create different node mask configs for same masks', () => {
            const anotherConfigurator = () => {};
            const expectedConfigsAmount = 2;

            projectConfig.nodeMask(mask, configurator);
            projectConfig.nodeMask(mask, anotherConfigurator);

            expect(projectConfig.getNodeMaskConfigs()).to.have.length(expectedConfigsAmount);
        });

        it('should support method chaining pattern', () => {
            const result = projectConfig.nodeMask(mask, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('task', () => {
        const taskName = 'test_task';
        const configurator = () => {};

        it('should add task config', () => {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfig(taskName)).to.exist
                .and.to.be.instanceOf(TaskConfig);
        });

        it('should add configurator to created task config', () => {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfig(taskName)._chains).to.contain(configurator);
        });

        it('should not create new task config if adding multiple configurators for same task name', () => {
            let firstTaskConfig;
            let secondTaskConfig;
            const anotherConfigurator = () => {};

            projectConfig.task(taskName, configurator);
            firstTaskConfig = projectConfig.getTaskConfig(taskName);
            projectConfig.task(taskName, anotherConfigurator);
            secondTaskConfig = projectConfig.getTaskConfig(taskName);

            expect(firstTaskConfig).to.be.equal(secondTaskConfig);
        });

        it('should support method chaining pattern', () => {
            const result = projectConfig.task(taskName, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('mode', () => {
        const modeName = 'test_mode';
        const configurator = () => {};

        it('should add mode config', () => {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfig(modeName)).to.exist
                .and.to.be.instanceOf(ModeConfig);
        });

        it('should add configurator to created mode config', () => {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfig(modeName)._chains).to.contain(configurator);
        });

        it('should not create new mode config if adding multiple configurators for same mode name', () => {
            let firstModeConfig;
            let secondModeConfig;
            const anotherConfigurator = () => {};

            projectConfig.mode(modeName, configurator);
            firstModeConfig = projectConfig.getModeConfig(modeName);
            projectConfig.mode(modeName, anotherConfigurator);
            secondModeConfig = projectConfig.getModeConfig(modeName);

            expect(firstModeConfig).to.be.equal(secondModeConfig);
        });

        it('should support method chaining pattern', () => {
            const result = projectConfig.mode(modeName, configurator);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('registerModule', () => {
        const moduleName = 'test_module';
        let moduleConfig;

        beforeEach(() => {
            moduleConfig = new ModuleConfig();
        });

        it('should register module', () => {
            projectConfig.registerModule(moduleName, moduleConfig);

            expect(projectConfig.module(moduleName)).to.be.equal(moduleConfig);
        });

        it('should not allow registering multiple modules for same name', () => {
            const anotherModuleConfig = new ModuleConfig();
            const expectedExcMessage = `Module "${moduleName}" is already registered`;
            const func = () => {
                projectConfig.registerModule(moduleName, moduleConfig);
                projectConfig.registerModule(moduleName, anotherModuleConfig);
            };

            expect(func).to.throw(expectedExcMessage);
        });

        it('should allow registering same module for different names', () => {
            const anotherModuleName = 'another_test_module';
            const func = () => {
                projectConfig.registerModule(moduleName, moduleConfig);
                projectConfig.registerModule(anotherModuleName, moduleConfig);
            };

            expect(func).to.not.throw();
        });
    });

    describe('module', () => {
        const moduleName = 'test_module';
        const configurator = () => {};
        let moduleConfig;

        beforeEach(() => {
            moduleConfig = new ModuleConfig();
            projectConfig.registerModule(moduleName, moduleConfig);
        });

        it('should add configurator to registered module', () => {
            projectConfig.module(moduleName, configurator);

            expect(projectConfig.module(moduleName)._chains).to.contain(configurator);
        });

        it('should throw error on attempt to configure non-registered module', () => {
            const nonRegisteredModuleName = 'non_registered_module';
            const expectedErrorMessage = `Module "${nonRegisteredModuleName}" is not registered.`;
            const func = () => { projectConfig.module(nonRegisteredModuleName, configurator); };

            expect(func).to.throw(expectedErrorMessage);
        });

        it('should return module if configurator is not provided', () => {
            expect(projectConfig.module(moduleName)).to.be.equal(moduleConfig);
        });

        it('should return self if configurator provided', () => {
            expect(projectConfig.module(moduleName, configurator)).to.be.equal(projectConfig);
        });
    });

    describe('getTaskConfigs', () => {
        const taskName = 'test_task';
        const configurator = () => {};

        it('should return tasks', () => {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(taskName);
        });
    });

    describe('getTaskConfig', () => {
        const taskName = 'test_task';
        const configurator = () => {};

        it('should return task config if it was added to project config', () => {
            projectConfig.task(taskName, configurator);

            expect(projectConfig.getTaskConfig(taskName)).to.exist
                .and.to.be.instanceOf(TaskConfig);
        });

        it('should return undefined if task config is missing in project config', () => {
            const missedTaskName = 'missed_task';

            expect(projectConfig.getTaskConfig(missedTaskName)).to.be.undefined;
        });
    });

    describe('getModeConfigs', () => {
        const modeName = 'test_mode';
        const configurator = () => {};

        it('should return mode configs', () => {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(modeName);
        });
    });

    describe('getModeConfig', () => {
        const modeName = 'test_mode';
        const configurator = () => {};

        it('should return mode config if mode was added to project config', () => {
            projectConfig.mode(modeName, configurator);

            expect(projectConfig.getModeConfig(modeName)).to.exist
                .and.to.be.instanceOf(ModeConfig);
        });

        it('should return undefined if mode was not added to project config', () => {
            const missedModeName = 'missed_mode';

            expect(projectConfig.getModeConfig(missedModeName)).to.be.undefined;
        });
    });

    describe('getNodeConfigs', () => {
        const nodePath = 'path/to/node';
        const configurator = () => {};

        it('should return node configs', () => {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfigs()).to.be.instanceOf(Object)
                .and.to.have.property(nodePath);
        });
    });

    describe('getNodeConfig', () => {
        const nodePath = 'path/to/node';
        const configurator = () => {};

        it('should return node config if it was added to project config', () => {
            projectConfig.node(nodePath, configurator);

            expect(projectConfig.getNodeConfig(nodePath)).to.exist
                .and.to.be.instanceOf(NodeConfig);
        });

        it('should return undefined if node config was not added for requested path', () => {
            const wrongNodePath = 'path/to/missing/node';

            expect(projectConfig.getNodeConfig(wrongNodePath)).to.be.undefined;
        });
    });

    describe('getNodeMaskConfigs', () => {
        const mask = /\w*bundles/g;
        const configurator = () => {};

        it('should return all node mask configs if no node path specified', () => {
            projectConfig.nodeMask(mask, configurator);

            expect(projectConfig.getNodeMaskConfigs()).to.be.instanceOf(Array)
                .and.to.have.length(1);
            expect(projectConfig.getNodeMaskConfigs()[0]).to.be.instanceOf(NodeMaskConfig);
        });

        it('should return mask config if it\'s mask matches with path', () => {
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

    describe('getEnv', () => {
        it('should return env option if it was set', () => {
            const optionName = 'option_name';
            const optionValue = 'option_value';

            projectConfig.setEnv(optionName, optionValue);

            expect(projectConfig.getEnv(optionName)).to.be.equal(optionValue);
        });

        it('should return undefined if env option was not set', () => {
            const optionName = 'option_name';

            expect(projectConfig.getEnv(optionName)).to.be.undefined;
        });
    });

    describe('setEnv', () => {
        it('should set env variable passed as key and value strings', () => {
            const optionName = 'option_name';
            const optionValue = 'option_value';

            projectConfig.setEnv(optionName, optionValue);

            expect(projectConfig.getEnv(optionName)).to.be.equal(optionValue);
        });

        it('should set env variable value as undefined if only variable name provided', () => {
            const optionName = 'option_name';
            let env;

            projectConfig.setEnv(optionName);
            env = projectConfig.getEnvValues();

            expect(env).to.have.property(optionName);
            expect(env[optionName]).to.be.undefined;
        });

        it('should set env variables passed as env variables hash', () => {
            const options = {
                foo: 'bar',
                fizz: 'buzz'
            };
            let env;

            projectConfig.setEnv(options);
            env = projectConfig.getEnvValues();

            Object.keys(options).forEach(key => {
                expect(env).to.have.property(key, options[key]);
            });
        });
    });

    describe('getEnvValues', () => {
        it('should return env values', () => {
            const expectedEnv = {};
            let env;

            Object.keys(process.env).forEach(key => {
                expectedEnv[key] = process.env[key];
            });
            env = projectConfig.getEnvValues();

            expect(env).to.be.deep.equal(expectedEnv);
        });
    });

    describe('includeConfig', () => {
        const configPath = path.join(__dirname, '../../fixtures/project-configs/project-config.js');

        it('should resolve config path before using it', () => {
            const nonResolvedConfigPath = '../../fixtures/project-configs/project-config.js';
            const expectedPath = configPath;

            projectConfig.includeConfig(nonResolvedConfigPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.contain(expectedPath);
        });

        it('should require config file and execute it passing self', () => {
            projectConfig.includeConfig(configPath);

            expect(projectConfig.___xxx___).to.be.true;
        });

        it('should add included config filename to included config filenames', () => {
            projectConfig.includeConfig(configPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.contain(configPath);
        });

        it('should support method chaining pattern', () => {
            const result = projectConfig.includeConfig(configPath);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getIncludedConfigFilenames', () => {
        const configPath = path.join(__dirname, '../../fixtures/project-configs/project-config.js');

        it('should return array containing included config filenames if any configs were included', () => {
            projectConfig.includeConfig(configPath);

            expect(projectConfig.getIncludedConfigFilenames()).to.be.instanceOf(Array)
                .and.to.have.length(1)
                .and.to.contain(configPath);
        });

        it('should return empty array if no configs were included', () => {
            expect(projectConfig.getIncludedConfigFilenames()).to.be.instanceOf(Array)
                .and.to.be.empty;
        });
    });

    describe('setLevelNamingScheme', () => {
        const levelPath = 'level/path';
        const schemeBuilder = () => {};
        let resolvePathSpy;

        beforeEach(() => {
            resolvePathSpy = new sinon.spy(projectConfig, 'resolvePath');
        });

        afterEach(() => {
            resolvePathSpy.reset();
        });

        after(() => {
            resolvePathSpy.restore();
        });

        it('should add level naming scheme to level naming schemes if level path passed as string', () => {
            const expectedLevelNamingSchemeName = projectConfig.resolvePath(levelPath);

            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes())
                .to.have.property(expectedLevelNamingSchemeName, schemeBuilder);
        });

        it('should add level naming scheme to level naming schemes if level path passed as array', () => {
            const expectedLevelNamingSchemeName = projectConfig.resolvePath(levelPath);

            projectConfig.setLevelNamingScheme([levelPath], schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes())
                .to.have.property(expectedLevelNamingSchemeName, schemeBuilder);
        });

        it('should add multiple level naming schemes to level naming schemes if level paths passed as ' +
            'array', () => {
            const anotherLevelPath = 'another/level/path';
            const paths = [levelPath, anotherLevelPath];

            projectConfig.setLevelNamingScheme(paths, schemeBuilder);

            paths.forEach(levelPath => {
                expect(projectConfig.getLevelNamingSchemes())
                    .to.have.property(projectConfig.resolvePath(levelPath), schemeBuilder);
            });
        });

        it('should resolve relative level path', () => {
            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(resolvePathSpy).to.be.calledWith(levelPath);
        });

        it('should not resolve absolute level path', () => {
            const absoluteLevelPath = `/${levelPath}`;

            projectConfig.setLevelNamingScheme(absoluteLevelPath, schemeBuilder);

            expect(resolvePathSpy).to.be.not.called;
        });

        it('should support method chaining pattern', () => {
            const result = projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(result).to.be.equal(projectConfig);
        });
    });

    describe('getLevelNamingSchemes', () => {
        it('should return level naming schemes', () => {
            const levelPath = 'level/path';
            const expectedLevelPath = projectConfig.resolvePath(levelPath);
            const schemeBuilder = () => {};

            projectConfig.setLevelNamingScheme(levelPath, schemeBuilder);

            expect(projectConfig.getLevelNamingSchemes()).to.be.instanceOf(Object)
                .and.to.have.property(expectedLevelPath, schemeBuilder);
        });
    });
});
