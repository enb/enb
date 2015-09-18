var path = require('path');
var NodeConfig = require('../../../lib/config/node-config');
var ModeConfig = require('../../../lib/config/mode-config');
var BaseTech = require('../../../lib/tech/base-tech');

describe('config/node-config', function () {
    describe('constructor', function () {
        it('should call parent constructor', function () {
            var nodeConfig = new NodeConfig();

            expect(nodeConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set path to node', function () {
            var nodePath = path.join('path', 'to', 'node');
            var nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig.getPath()).to.be.equal(nodePath);
        });

        it('should set project root path', function () {
            var rootPath = path.join('root', 'path');
            var nodeConfig = new NodeConfig(null, rootPath);

            expect(nodeConfig._root).to.be.equal(rootPath);
        });

        it('should set project config', function () {
            var projectConfig = { testConfigField: 'test_config_val' };
            var nodeConfig = new NodeConfig(null, null, projectConfig);

            expect(nodeConfig._projectConfig).to.be.equal(projectConfig);
        });

        it('should set basename of node path', function () {
            var nodePath = path.join('path', 'to', 'node');
            var expectedBaseName = 'node';
            var nodeConfig = new NodeConfig(nodePath);

            expect(nodeConfig._baseName).to.be.equal(expectedBaseName);
        });

        it('should create container for targets', function () {
            var nodeConfig = new NodeConfig();

            expect(nodeConfig._targets).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should create container for targets that may be cleaned', function () {
            var nodeConfig = new NodeConfig();

            expect(nodeConfig._cleanTargets).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('shoud create container for techs', function () {
            var nodeConfig = new NodeConfig();

            expect(nodeConfig._techs).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should define property for languages container', function () {
            var nodeConfig = new NodeConfig();

            expect(nodeConfig).to.have.property('_languages');
        });

        it('should not create languages container', function () {
            var nodeConfig = new NodeConfig();

            expect(nodeConfig._languages).to.be.null;
        });

        it('should create containter for modes', function () {
            var nodeConfig = new NodeConfig();

            expect(nodeConfig._modes).to.be.instanceOf(Object)
                .and.to.be.empty;
        });
    });

    describe('mode', function () {
        var nodeConfig;
        var testMode = 'test_mode';

        beforeEach(function () {
            nodeConfig = new NodeConfig();
        });

        it('should create mode config for a mode', function () {
            nodeConfig.mode(testMode);

            expect(nodeConfig.getModeConfig(testMode)).to.be.instanceOf(ModeConfig);
        });

        it('should create different mode configs for different modes', function () {
            var anotherTestMode = 'another_test_mode';
            var testModeConfig;
            var anotherTestModeConfig;

            nodeConfig.mode(testMode);
            nodeConfig.mode(anotherTestMode);

            testModeConfig = nodeConfig.getModeConfig(testMode);
            anotherTestModeConfig = nodeConfig.getModeConfig(anotherTestMode);

            expect(testModeConfig).to.exist;
            expect(anotherTestModeConfig).to.exist;
            expect(testModeConfig).to.be.not.equal(anotherTestModeConfig);
        });

        it('should not overwrite mode config if it was already created', function () {
            var initialModeConfig;

            nodeConfig.mode(testMode);
            initialModeConfig = nodeConfig.getModeConfig(testMode);
            nodeConfig.mode(testMode);

            expect(nodeConfig.getModeConfig(testMode)).to.be.equal(initialModeConfig);
        });

        it('should add callback to mode config of required mode', function () {
            var callback = function () {};

            nodeConfig.mode(testMode, callback);

            expect(nodeConfig.getModeConfig(testMode)._chains).to.contain(callback);
        });

        it('should support method chaining pattern', function () {
            var result = nodeConfig.mode(testMode);

            expect(result).to.be.equal(nodeConfig);
        });
    });

    describe('setLanguages', function () {
        var nodeConfig;
        var ru = 'ru';
        var en = 'en';
        var languages = [ru, en];

        beforeEach(function () {
            nodeConfig = new NodeConfig();
        });

        it('should set languages for node', function () {
            nodeConfig.setLanguages(languages);

            expect(nodeConfig.getLanguages()).to.have.length(languages.length)
                .and.to.contain(ru)
                .and.to.contain(en);
        });

        it('should support method chaining pattern', function () {
            expect(nodeConfig.setLanguages(languages)).to.be.equal(nodeConfig);
        });
    });

    describe('getLanguages', function () {
        var nodeConfig;
        var en = 'en';
        var ru = 'ru';
        var languages = [en, ru];

        beforeEach(function () {
            nodeConfig = new NodeConfig();
        });

        it('should return languages if they were set previously', function () {
            nodeConfig.setLanguages(languages);

            expect(nodeConfig.getLanguages()).to.have.length(languages.length)
                .and.to.contain(en)
                .and.to.contain(ru);
        });

        it('should return null if languages were not set', function () {
            expect(nodeConfig.getLanguages()).to.be.null;
        });
    });

    describe('getNodePath', function () {
        it('should return absolute path to the node', function () {
            var rootPath = path.join('root', 'path');
            var nodePath = path.join('path', 'to', 'node');
            var nodeConfig = new NodeConfig(nodePath, rootPath);

            expect(nodeConfig.getNodePath()).to.be.equal(rootPath + path.sep + nodePath);
        });
    });

    describe('resolvePath', function () {
        var rootPath = path.join('root', 'path');
        var nodePath = path.join('path', 'to', 'node');
        var nodeConfig = null;

        beforeEach(function () {
            nodeConfig = new NodeConfig(nodePath, rootPath);
        });

        it('should return absolute path to file based on absolute path to node', function () {
            var filePath = 'file.js';

            expect(nodeConfig.resolvePath(filePath)).to.be.equal(rootPath + path.sep + nodePath + path.sep + filePath);
        });

        it('should return absolute path to node if no file path provided', function () {
            expect(nodeConfig.resolvePath()).to.be.equal(nodeConfig.getNodePath());
        });
    });

    describe('addTarget', function () {
        var nodeConfig;
        var languages = []; // setting languages because _processTarget will crash without it

        beforeEach(function () {
            nodeConfig = new NodeConfig();
            nodeConfig.setLanguages(languages);
        });

        it('should add target to node config', function () {
            var target = 'target.js';

            nodeConfig.addTarget(target);

            expect(nodeConfig.getTargets()).to.contain(target);
        });

        it('should process target before adding it to node config', function () {
            var spy = new sinon.spy(nodeConfig, '_processTarget');
            var target = 'target.js';

            nodeConfig.addTarget(target);

            expect(spy).to.be.called
                .and.to.be.calledWith(target);
        });

        it('should add target second time if it was already added to targets', function () {
            var target = 'target.js';
            var expectedTargetLength = 2;

            nodeConfig.addTarget(target);
            nodeConfig.addTarget(target);

            expect(nodeConfig.getTargets().length).to.be.equal(expectedTargetLength);
            nodeConfig.getTargets().forEach(function (addedTarget) {
                expect(addedTarget).to.be.equal(target);
            });
        });

        it('should support method chaining pattern', function () {
            var target = 'target.js';
            var result = nodeConfig.addTarget(target);

            expect(result).to.be.equal(nodeConfig);
        });
    });

    describe('addTargets', function () {
        var nodeConfig;
        var languages = []; // setting languages because _processTarget will crash without it

        beforeEach(function () {
            nodeConfig = new NodeConfig();
            nodeConfig.setLanguages(languages);
        });

        it('should add multiple targets to node config', function () {
            var firstTarget = 'target.css';
            var secondTarget = 'target.js';
            var targets = [firstTarget, secondTarget];

            nodeConfig.addTargets(targets);

            expect(nodeConfig.getTargets()).to.contain(firstTarget)
                .and.to.contain(secondTarget);
        });

        it('should process each target before adding it to node config', function () {
            var spy = new sinon.spy(nodeConfig, '_processTarget');
            var firstTarget = 'target.css';
            var secondTarget = 'target.js';
            var targets = [firstTarget, secondTarget];
            var callsAmount = targets.length;

            nodeConfig.addTargets(targets);

            expect(spy).to.be.called
                .and.to.have.callCount(callsAmount);
        });

        it('should support method chaining pattern', function () {
            var targets = ['target.js'];
            var result = nodeConfig.addTargets(targets);

            expect(result).to.be.equal(nodeConfig);
        });
    });

    describe('_processTarget', function () {
        var rootPath = path.join('root', 'path');
        var nodePath = path.join('path', 'to', 'node');
        var languages = ['ru', 'en'];
        var nodeConfig;

        beforeEach(function () {
            nodeConfig = new NodeConfig(nodePath, rootPath);
            nodeConfig.setLanguages(languages);
        });

        it('should return result of target processing as array', function () {
            var target = '.css';

            expect(nodeConfig._processTarget(target)).to.be.instanceOf(Array)
                .and.to.contain(target);
        });

        it('should remove leading slashes from target', function () {
            var target = '/test_target';
            var expectedTarget = 'test_target';
            var resultTargets = nodeConfig._processTarget(target);

            expect(resultTargets[0]).to.be.equal(expectedTarget);
        });

        it('should remove trailing slashes from target', function () {
            var target = 'test_target/';
            var expectedTarget = 'test_target';
            var resultTargets = nodeConfig._processTarget(target);

            expect(resultTargets[0]).to.be.equal(expectedTarget);
        });

        it('should replace ? symbol with node path basename', function () {
            var target = '?.js';
            var expectedTarget = 'node.js';
            var resultTargets = nodeConfig._processTarget(target);

            expect(resultTargets[0]).to.be.equal(expectedTarget);
        });

        it('should return target for each available language for target with {lang} part', function () {
            var target = '{lang}.js';
            var ruTarget = 'ru.js';
            var enTarget = 'en.js';

            var result = nodeConfig._processTarget(target);
            expect(result).to.contain(ruTarget)
                .and.to.contain(enTarget);
        });

        it('should remove {%option%} entries different from {lang} from target', function () {
            var target = '{test}.js';
            var expectedTarget = '.js';
            var resultingTargets = nodeConfig._processTarget(target);

            expect(resultingTargets).to.contain(expectedTarget);
        });
    });

    describe('addCleanTarget', function () {
        var languages = []; // setting languages because _processTarget will crash without it
        var nodeConfig;

        beforeEach(function () {
            nodeConfig = new NodeConfig();
            nodeConfig.setLanguages(languages);
        });

        it('should add clean target to node config', function () {
            var target = 'target.css';

            nodeConfig.addCleanTarget(target);

            expect(nodeConfig.getCleanTargets()).to.contain(target);
        });

        it('should process target before adding it to node config', function () {
            var spy = new sinon.spy(nodeConfig, '_processTarget');
            var target = 'target.js';

            nodeConfig.addCleanTarget(target);

            expect(spy).to.be.called
                .and.to.be.calledWith(target);
        });

        it('should support method chaining pattern', function () {
            expect(nodeConfig.addCleanTarget('target.css')).to.be.equal(nodeConfig);
        });
    });

    describe('addCleanTargets', function () {
        var languages = []; // setting languages because _processTarget will crash without it
        var nodeConfig;

        beforeEach(function () {
            nodeConfig = new NodeConfig();
            nodeConfig.setLanguages(languages);
        });

        it('should add multiple clean targets to node config', function () {
            var firstTarget = 'target.css';
            var secondTarget = 'target.js';
            var targets = [firstTarget, secondTarget];

            nodeConfig.addCleanTargets(targets);

            expect(nodeConfig.getCleanTargets()).to.contain(firstTarget)
                .and.to.contain(secondTarget);
        });

        it('should process each target before adding it to node config', function () {
            var spy = new sinon.spy(nodeConfig, '_processTarget');
            var firstTarget = 'target.css';
            var secondTarget = 'target.js';
            var targets = [firstTarget, secondTarget];
            var callsAmount = targets.length;

            nodeConfig.addCleanTargets(targets);

            expect(spy).to.be.called
                .and.to.have.callCount(callsAmount);
        });

        it('should support method chaining pattern', function () {
            expect(nodeConfig.addCleanTargets(['target.css'])).to.be.equal(nodeConfig);
        });
    });

    describe('addTech', function () {
        var nodeConfig;

        beforeEach(function () {
            nodeConfig = new NodeConfig();
        });

        it('should add tech passed as array containing tech class', function () {
            var TechClass = BaseTech;
            var tech = [TechClass];

            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.contain(new TechClass());
        });

        it('should add tech passed as tech class with params', function () {
            var techParams = { foo: 'bar' };
            var TechClass = BaseTech;
            var tech = [TechClass, techParams];

            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.contain(new TechClass(techParams));
        });

        it('should process tech params when adding tech as tech class and params', function () {
            var spy = new sinon.spy(nodeConfig, '_processTechOptions');
            var techParams = { foo: 'bar' };
            var techClass = BaseTech;
            var tech = [techClass, techParams];

            nodeConfig.addTech(tech);

            expect(spy).to.be.called
                .and.to.be.calledWith(techParams);
        });

        it('should add multiple tech instances for each language if language set in options', function () {
            var languages = ['ru', 'en'];
            var techParams = { lang: '{lang}' };
            var ruTechParams = { lang: 'ru' };
            var enTechParams = { lang: 'en' };
            var TechClass = BaseTech;
            var tech = [TechClass, techParams];

            nodeConfig.setLanguages(languages);
            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.contain(new TechClass(ruTechParams))
                .and.to.contain(new TechClass(enTechParams));
        });

        it('should add tech passed as tech class', function () {
            var TechClass = BaseTech;

            nodeConfig.addTech(TechClass);

            expect(nodeConfig.getTechs()).to.contain(new TechClass());
        });

        it('should add already instantiated tech', function () {
            var tech = new BaseTech();

            nodeConfig.addTech(tech);

            expect(nodeConfig.getTechs()).to.contain(tech);
        });

        it('should support method chaining pattern', function () {
            expect(nodeConfig.addTech(BaseTech)).to.be.equal(nodeConfig);
        });
    });

    describe('addTechs', function () {
        var nodeConfig;
        var SecondTech = function (params) { this.second = params; }; // need because instantiated objects must differ
        var ThirdTech = function (params) { this.third = params; };

        beforeEach(function () {
            nodeConfig = new NodeConfig();
        });

        it('should add multiple techs passed as tech class with params', function () {
            var firstTechParams = { foo: 'bar' };
            var FirstTechClass = BaseTech;
            var secondTechParams = { fizz: 'baz' };
            var SecondTechClass = SecondTech;
            var firstTech = [FirstTechClass, firstTechParams];
            var secondTech = [SecondTechClass, secondTechParams];
            var techs = [firstTech, secondTech];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.contain(new FirstTechClass(firstTechParams))
                .and.to.contain(new SecondTechClass(secondTechParams));
        });

        it('should process tech params for all techs when adding tech as tech class and params', function () {
            var spy = new sinon.spy(nodeConfig, '_processTechOptions');
            var firstTechParams = { foo: 'bar' };
            var firstTechClass = BaseTech;
            var secondTechParams = { fizz: 'baz' };
            var secondTechClass = SecondTech;
            var firstTech = [firstTechClass, firstTechParams];
            var secondTech = [secondTechClass, secondTechParams];
            var techs = [firstTech, secondTech];
            var expectedCallCount = techs.length;

            nodeConfig.addTechs(techs);

            expect(spy).to.be.called
                .and.to.have.callCount(expectedCallCount);
        });

        it('should add multiple techs passed as tech classes', function () {
            var FirstTechClass = BaseTech;
            var SecondTechClass = SecondTech;
            var techs = [FirstTechClass, SecondTechClass];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.contain(new FirstTechClass())
                .and.to.contain(new SecondTechClass());
        });

        it('should add multiple instantiated techs', function () {
            var firstTech = new BaseTech();
            var secondTech = new SecondTech();
            var techs = [firstTech, secondTech];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.contain(firstTech)
                .and.to.contain(secondTech);
        });

        it('should add multiple techs declared in all supported ways', function () {
            var firstTech = new BaseTech();
            var SecondTechClass = SecondTech;
            var thirdTechParams = { foo: 'bar' };
            var ThirdTechClass = ThirdTech;
            var thirdTech = [ThirdTechClass, thirdTechParams];
            var techs = [firstTech, SecondTechClass, thirdTech];

            nodeConfig.addTechs(techs);

            expect(nodeConfig.getTechs()).to.contain(firstTech)
                .and.to.contain(new SecondTechClass())
                .and.to.contain(new ThirdTechClass(thirdTechParams));
        });

        it('should support method chaining pattern', function () {
            var tech = new BaseTech();

            expect(nodeConfig.addTechs([tech])).to.be.equal(nodeConfig);
        });
    });

    describe('_processTechOptions', function () {
        var nodeConfig;
        var languages = ['ru', 'en'];

        beforeEach(function () {
            nodeConfig = new NodeConfig();
            nodeConfig.setLanguages(languages);
        });

        it('should return options array as result', function () {
            var options = { foo: 'bar' };
            var result = nodeConfig._processTechOptions(options);

            expect(result).to.be.instanceOf(Array);
        });

        it('should not modify options if they are not contain {lang} entry', function () {
            var options = { foo: 'bar' };
            var result = nodeConfig._processTechOptions(options);

            expect(result).to.be.deep.equal([options]);
        });

        it('should return options copy for each language if any option contain {lang}', function () {
            var options = { foo: 'bar', lang: '{lang}' };
            var expectedRuOptions = { foo: 'bar', lang: 'ru' };
            var expectedEnOptions = { foo: 'bar', lang: 'en' };
            var result = nodeConfig._processTechOptions(options);

            expect(result).to.contain(expectedEnOptions)
                .and.to.contain(expectedRuOptions);
        });

        it('should not process any directives different from {lang}', function () {
            var options = { foo: 'bar', custom: '{custom}' };
            var expectedResult = { foo: 'bar', custom: '{custom}' };
            var result = nodeConfig._processTechOptions(options);

            expect(result).to.contain(expectedResult);
        });
    });
});
