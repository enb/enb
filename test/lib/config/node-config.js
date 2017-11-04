'use strict'

const path = require('path');
const NodeConfig = require('../../../lib/config/node-config');
const ModeConfig = require('../../../lib/config/mode-config');
const BaseTech = require('../../../lib/tech/base-tech');

describe('config/node-config', () => {
    const nodePath = path.join('path', 'to', 'node');

    describe('constructor', () => {
        it('should call parent constructor', () => {
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set path to node', () => {
            const nodePath = path.join('path', 'to', 'node');
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig.getPath()).to.be.equal(nodePath);
        });

        it('should set project root path', () => {
            const rootPath = path.join('root', 'path');
            const nodeConfig = new NodeConfig(nodePath, rootPath);

            expect(nodeConfig._root).to.be.equal(rootPath);
        });

        it('should set project config', () => {
            const projectConfig = { testConfigField: 'test_config_val' };
            const nodeConfig = new NodeConfig(nodePath, null, projectConfig);

            expect(nodeConfig._projectConfig).to.be.equal(projectConfig);
        });

        it('should set basename of node path', () => {
            const nodePath = path.join('path', 'to', 'node');
            const expectedBaseName = 'node';
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._baseName).to.be.equal(expectedBaseName);
        });

        it('should create container for targets', () => {
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._targets).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should create container for targets that may be cleaned', () => {
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._cleanTargets).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('shoud create container for techs', () => {
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._techs).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should define property for languages container', () => {
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig).to.have.property('_languages');
        });

        it('should not create languages container', () => {
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._languages).to.be.null;
        });

        it('should create containter for modes', () => {
            const nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._modes).to.be.instanceOf(Object)
                .and.to.be.empty;
        });
    });

    describe('mode', () => {
        let nodeConfig;
        const testMode = 'test_mode';

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
        });

        it('should create mode config for a mode', () => {
            nodeConfig.mode(testMode);

            expect(nodeConfig.getModeConfig(testMode)).to.be.instanceOf(ModeConfig);
        });

        it('should create different mode configs for different modes', () => {
            const anotherTestMode = 'another_test_mode';
            let testModeConfig;
            let anotherTestModeConfig;

            nodeConfig.mode(testMode);
            nodeConfig.mode(anotherTestMode);

            testModeConfig = nodeConfig.getModeConfig(testMode);
            anotherTestModeConfig = nodeConfig.getModeConfig(anotherTestMode);

            expect(testModeConfig).to.exist;
            expect(anotherTestModeConfig).to.exist;
            expect(testModeConfig).to.be.not.equal(anotherTestModeConfig);
        });

        it('should not overwrite mode config if it was already created', () => {
            let initialModeConfig;

            nodeConfig.mode(testMode);
            initialModeConfig = nodeConfig.getModeConfig(testMode);
            nodeConfig.mode(testMode);

            expect(nodeConfig.getModeConfig(testMode)).to.be.equal(initialModeConfig);
        });

        it('should add callback to mode config of required mode', () => {
            const callback = () => {};

            nodeConfig.mode(testMode, callback);

            expect(nodeConfig.getModeConfig(testMode)._chains).to.contain(callback);
        });

        it('should support method chaining pattern', () => {
            const result = nodeConfig.mode(testMode);

            expect(result).to.be.equal(nodeConfig);
        });
    });

    describe('setLanguages', () => {
        let nodeConfig;
        const ru = 'ru';
        const en = 'en';
        const languages = [ru, en];

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
        });

        it('should set languages for node', () => {
            nodeConfig.setLanguages(languages);

            expect(nodeConfig.getLanguages()).to.have.length(languages.length)
                .and.to.contain(ru)
                .and.to.contain(en);
        });

        it('should support method chaining pattern', () => {
            expect(nodeConfig.setLanguages(languages)).to.be.equal(nodeConfig);
        });
    });

    describe('getLanguages', () => {
        let nodeConfig;
        const en = 'en';
        const ru = 'ru';
        const languages = [en, ru];

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
        });

        it('should return languages if they were set previously', () => {
            nodeConfig.setLanguages(languages);

            expect(nodeConfig.getLanguages()).to.have.length(languages.length)
                .and.to.contain(en)
                .and.to.contain(ru);
        });

        it('should return null if languages were not set', () => {
            expect(nodeConfig.getLanguages()).to.be.null;
        });
    });

    describe('getNodePath', () => {
        it('should return absolute path to the node', () => {
            const rootPath = path.join('root', 'path');
            const nodePath = path.join('path', 'to', 'node');
            const nodeConfig = new NodeConfig(nodePath, rootPath);

            expect(nodeConfig.getNodePath()).to.be.equal(rootPath + path.sep + nodePath);
        });
    });

    describe('resolvePath', () => {
        const rootPath = path.join('root', 'path');
        const nodePath = path.join('path', 'to', 'node');
        let nodeConfig = null;

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath, rootPath);
        });

        it('should return absolute path to file based on absolute path to node', () => {
            const filePath = 'file.js';

            expect(nodeConfig.resolvePath(filePath)).to.be.equal(rootPath + path.sep + nodePath + path.sep + filePath);
        });

        it('should return absolute path to node if no file path provided', () => {
            expect(nodeConfig.resolvePath()).to.be.equal(nodeConfig.getNodePath());
        });
    });

    describe('addTarget', () => {
        let nodeConfig;
        const languages = []; // setting languages because _processTarget will crash without it

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
            nodeConfig.setLanguages(languages);
        });

        it('should add target to node config', () => {
            const target = 'target.js';

            nodeConfig.addTarget(target);

            expect(nodeConfig.getTargets()).to.contain(target);
        });

        it('should process target before adding it to node config', () => {
            const spy = new sinon.spy(nodeConfig, '_processTarget');
            const target = 'target.js';

            nodeConfig.addTarget(target);

            expect(spy).to.be.called
                .and.to.be.calledWith(target);
        });

        it('should add target second time if it was already added to targets', () => {
            const target = 'target.js';
            const expectedTargetLength = 2;

            nodeConfig.addTarget(target);
            nodeConfig.addTarget(target);

            expect(nodeConfig.getTargets().length).to.be.equal(expectedTargetLength);
            nodeConfig.getTargets().forEach(addedTarget => {
                expect(addedTarget).to.be.equal(target);
            });
        });

        it('should support method chaining pattern', () => {
            const target = 'target.js';
            const result = nodeConfig.addTarget(target);

            expect(result).to.be.equal(nodeConfig);
        });
    });

    describe('addTargets', () => {
        let nodeConfig;
        const languages = []; // setting languages because _processTarget will crash without it

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
            nodeConfig.setLanguages(languages);
        });

        it('should add multiple targets to node config', () => {
            const firstTarget = 'target.css';
            const secondTarget = 'target.js';
            const targets = [firstTarget, secondTarget];

            nodeConfig.addTargets(targets);

            expect(nodeConfig.getTargets()).to.contain(firstTarget)
                .and.to.contain(secondTarget);
        });

        it('should process each target before adding it to node config', () => {
            const spy = new sinon.spy(nodeConfig, '_processTarget');
            const firstTarget = 'target.css';
            const secondTarget = 'target.js';
            const targets = [firstTarget, secondTarget];
            const callsAmount = targets.length;

            nodeConfig.addTargets(targets);

            expect(spy).to.be.called
                .and.to.have.callCount(callsAmount);
        });

        it('should support method chaining pattern', () => {
            const targets = ['target.js'];
            const result = nodeConfig.addTargets(targets);

            expect(result).to.be.equal(nodeConfig);
        });
    });

    describe('_processTarget', () => {
        const rootPath = path.join('root', 'path');
        const nodePath = path.join('path', 'to', 'node');
        const languages = ['ru', 'en'];
        let nodeConfig;

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath, rootPath);
            nodeConfig.setLanguages(languages);
        });

        it('should return result of target processing as array', () => {
            const target = '.css';

            expect(nodeConfig._processTarget(target)).to.be.instanceOf(Array)
                .and.to.contain(target);
        });

        it('should remove leading slashes from target', () => {
            const target = '/test_target';
            const expectedTarget = 'test_target';
            const resultTargets = nodeConfig._processTarget(target);

            expect(resultTargets[0]).to.be.equal(expectedTarget);
        });

        it('should remove trailing slashes from target', () => {
            const target = 'test_target/';
            const expectedTarget = 'test_target';
            const resultTargets = nodeConfig._processTarget(target);

            expect(resultTargets[0]).to.be.equal(expectedTarget);
        });

        it('should replace ? symbol with node path basename', () => {
            const target = '?.js';
            const expectedTarget = 'node.js';
            const resultTargets = nodeConfig._processTarget(target);

            expect(resultTargets[0]).to.be.equal(expectedTarget);
        });

        it('should return target for each available language for target with {lang} part', () => {
            const target = '{lang}.js';
            const ruTarget = 'ru.js';
            const enTarget = 'en.js';

            const result = nodeConfig._processTarget(target);
            expect(result).to.contain(ruTarget)
                .and.to.contain(enTarget);
        });

        it('should remove {%option%} entries different from {lang} from target', () => {
            const target = '{test}.js';
            const expectedTarget = '.js';
            const resultingTargets = nodeConfig._processTarget(target);

            expect(resultingTargets).to.contain(expectedTarget);
        });
    });

    describe('addCleanTarget', () => {
        const languages = []; // setting languages because _processTarget will crash without it
        let nodeConfig;

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
            nodeConfig.setLanguages(languages);
        });

        it('should add clean target to node config', () => {
            const target = 'target.css';

            nodeConfig.addCleanTarget(target);

            expect(nodeConfig.getCleanTargets()).to.contain(target);
        });

        it('should process target before adding it to node config', () => {
            const spy = new sinon.spy(nodeConfig, '_processTarget');
            const target = 'target.js';

            nodeConfig.addCleanTarget(target);

            expect(spy).to.be.called
                .and.to.be.calledWith(target);
        });

        it('should support method chaining pattern', () => {
            expect(nodeConfig.addCleanTarget('target.css')).to.be.equal(nodeConfig);
        });
    });

    describe('addCleanTargets', () => {
        const languages = []; // setting languages because _processTarget will crash without it
        let nodeConfig;

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
            nodeConfig.setLanguages(languages);
        });

        it('should add multiple clean targets to node config', () => {
            const firstTarget = 'target.css';
            const secondTarget = 'target.js';
            const targets = [firstTarget, secondTarget];

            nodeConfig.addCleanTargets(targets);

            expect(nodeConfig.getCleanTargets()).to.contain(firstTarget)
                .and.to.contain(secondTarget);
        });

        it('should process each target before adding it to node config', () => {
            const spy = new sinon.spy(nodeConfig, '_processTarget');
            const firstTarget = 'target.css';
            const secondTarget = 'target.js';
            const targets = [firstTarget, secondTarget];
            const callsAmount = targets.length;

            nodeConfig.addCleanTargets(targets);

            expect(spy).to.be.called
                .and.to.have.callCount(callsAmount);
        });

        it('should support method chaining pattern', () => {
            expect(nodeConfig.addCleanTargets(['target.css'])).to.be.equal(nodeConfig);
        });
    });

    describe('addTech', () => {
        let nodeConfig;

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
        });

        it('should add tech passed as array containing tech class', () => {
            const TechClass = BaseTech;
            const tech = [TechClass];

            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.deep.contain(new TechClass());
        });

        it('should add tech passed as tech class with params', () => {
            const techParams = { foo: 'bar' };
            const TechClass = BaseTech;
            const tech = [TechClass, techParams];

            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.deep.contain(new TechClass(techParams));
        });

        it('should process tech params when adding tech as tech class and params', () => {
            const spy = new sinon.spy(nodeConfig, '_processTechOptions');
            const techParams = { foo: 'bar' };
            const techClass = BaseTech;
            const tech = [techClass, techParams];

            nodeConfig.addTech(tech);

            expect(spy).to.be.called
                .and.to.be.calledWith(techParams);
        });

        it('should add multiple tech instances for each language if language set in options', () => {
            const languages = ['ru', 'en'];
            const techParams = { lang: '{lang}' };
            const ruTechParams = { lang: 'ru' };
            const enTechParams = { lang: 'en' };
            const TechClass = BaseTech;
            const tech = [TechClass, techParams];

            nodeConfig.setLanguages(languages);
            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.deep.contain(new TechClass(ruTechParams))
                .and.to.deep.contain(new TechClass(enTechParams));
        });

        it('should add tech passed as tech class', () => {
            const TechClass = BaseTech;

            nodeConfig.addTech(TechClass);

            expect(nodeConfig.getTechs()).to.deep.contain(new TechClass());
        });

        it('should add already instantiated tech', () => {
            const tech = new BaseTech();

            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.deep.contain(tech);
        });

        it('should support method chaining pattern', () => {
            expect(nodeConfig.addTech(BaseTech)).to.be.equal(nodeConfig);
        });
    });

    describe('addTechs', () => {
        let nodeConfig;
        const SecondTech = function (params) { this.second = params; }; // need because instantiated objects must differ
        const ThirdTech = function (params) { this.third = params; };

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
        });

        it('should add multiple techs passed as tech class with params', () => {
            const firstTechParams = { foo: 'bar' };
            const FirstTechClass = BaseTech;
            const secondTechParams = { fizz: 'baz' };
            const SecondTechClass = SecondTech;
            const firstTech = [FirstTechClass, firstTechParams];
            const secondTech = [SecondTechClass, secondTechParams];
            const techs = [firstTech, secondTech];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.deep.contain(new FirstTechClass(firstTechParams))
                .and.to.deep.contain(new SecondTechClass(secondTechParams));
        });

        it('should process tech params for all techs when adding tech as tech class and params', () => {
            const spy = new sinon.spy(nodeConfig, '_processTechOptions');
            const firstTechParams = { foo: 'bar' };
            const firstTechClass = BaseTech;
            const secondTechParams = { fizz: 'baz' };
            const secondTechClass = SecondTech;
            const firstTech = [firstTechClass, firstTechParams];
            const secondTech = [secondTechClass, secondTechParams];
            const techs = [firstTech, secondTech];
            const expectedCallCount = techs.length;

            nodeConfig.addTechs(techs);

            expect(spy).to.be.called
                .and.to.have.callCount(expectedCallCount);
        });

        it('should add multiple techs passed as tech classes', () => {
            const FirstTechClass = BaseTech;
            const SecondTechClass = SecondTech;
            const techs = [FirstTechClass, SecondTechClass];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.deep.contain(new FirstTechClass())
                .and.to.deep.contain(new SecondTechClass());
        });

        it('should add multiple instantiated techs', () => {
            const firstTech = new BaseTech();
            const secondTech = new SecondTech();
            const techs = [firstTech, secondTech];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.deep.contain(firstTech)
                .and.to.deep.contain(secondTech);
        });

        it('should add multiple techs declared in all supported ways', () => {
            const firstTech = new BaseTech();
            const SecondTechClass = SecondTech;
            const thirdTechParams = { foo: 'bar' };
            const ThirdTechClass = ThirdTech;
            const thirdTech = [ThirdTechClass, thirdTechParams];
            const techs = [firstTech, SecondTechClass, thirdTech];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.deep.contain(firstTech)
                .and.to.deep.contain(new SecondTechClass())
                .and.to.deep.contain(new ThirdTechClass(thirdTechParams));
        });

        it('should support method chaining pattern', () => {
            const tech = new BaseTech();

            expect(nodeConfig.addTechs([tech])).to.be.equal(nodeConfig);
        });
    });

    describe('_processTechOptions', () => {
        let nodeConfig;
        const languages = ['ru', 'en'];

        beforeEach(() => {
            nodeConfig = new NodeConfig(nodePath);
            nodeConfig.setLanguages(languages);
        });

        it('should return options array as result', () => {
            const options = { foo: 'bar' };
            const result = nodeConfig._processTechOptions(options);

            expect(result).to.be.instanceOf(Array);
        });

        it('should not modify options if they are not contain {lang} entry', () => {
            const options = { foo: 'bar' };
            const result = nodeConfig._processTechOptions(options);

            expect(result).to.be.deep.equal([options]);
        });

        it('should return options copy for each language if any option contain {lang}', () => {
            const options = { foo: 'bar', lang: '{lang}' };
            const expectedRuOptions = { foo: 'bar', lang: 'ru' };
            const expectedEnOptions = { foo: 'bar', lang: 'en' };
            const result = nodeConfig._processTechOptions(options);

            expect(result).to.deep.contain(expectedEnOptions)
                .and.to.deep.contain(expectedRuOptions);
        });

        it('should not process any directives different from {lang}', () => {
            const options = { foo: 'bar', custom: '{custom}' };
            const expectedResult = { foo: 'bar', custom: '{custom}' };
            const result = nodeConfig._processTechOptions(options);

            expect(result).to.deep.contain(expectedResult);
        });
    });
});
