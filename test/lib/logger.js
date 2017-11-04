'use strict'

const path = require('path');

const Logger = require('../../lib/logger');
const colors = require('../../lib/ui/colorize');

const REGEX = {
    time: /\d{2}:\d{2}:\d{2}\.\d{3}/,
    deprecatedTech: {
        samePackagesMessage: /Tech \S+ is deprecated\. Use tech \S+ instead\./,
        differentPackagesMessage: /Tech \S+ is deprecated\. Install package \S+ and use tech \S+ instead\./
    },
    deprecatedOption: {
        newOptionUnavailable: /Option \S+ of \S+ is deprecated\./,
        newOptionAvailable: /Option \S+ of \S+ is deprecated\. Use option \S+ instead\./
    }
};

describe('logger', () => {
    let logger;
    let consoleLogSpy;
    let consoleWarnSpy;
    let consoleErrorSpy;
    let message;

    before(() => {
        // spying at console methods because logger built on top of it
        consoleLogSpy = sinon.spy(console, 'log');
        consoleWarnSpy = sinon.spy(console, 'warn');
        consoleErrorSpy = sinon.spy(console, 'error');
        logger = new Logger();
        message = 'test_message';
    });

    beforeEach(() => {
        consoleLogSpy.reset();
        consoleWarnSpy.reset();
        consoleErrorSpy.reset();
    });

    after(() => {
        consoleLogSpy.restore();
        consoleWarnSpy.restore();
        consoleErrorSpy.restore();
    });

    describe('constructor', () => {
        it('should set scope passed in params', () => {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);

            expect(loggerWithScope._scope).to.be.equal(scope);
        });

        it('should make logger enabled by default', () => {
            const newLogger = new Logger();

            expect(newLogger.isEnabled()).to.be.true;
        });

        it('should set options passed in params', () => {
            const options = { hideWarnings: true };
            const loggerWithOptions = new Logger(null, options);

            expect(loggerWithOptions._options).to.be.deep.equal(options);
        });
    });

    describe('log', () => {
        it('should not log message if logger disabled', () => {
            const disabledLogger = new Logger();

            disabledLogger.setEnabled(false);
            disabledLogger.log(message);

            expect(consoleLogSpy).to.be.not.called;
        });

        it('should add time to log in format HH:mm:ss.AAA', () => {
            logger.log(message);

            expect(consoleLogSpy).to.be.calledWithMatch(REGEX.time);
        });

        it('should colorize time with grey color by default', () => {
            const timeWithDash = `${REGEX.time.toString().replace(/\//g, '')} - `;
            const colorizedTimeWithDash = colors.grey(timeWithDash).replace(/\[/g, '\\[');

            logger.log(message);

            expect(consoleLogSpy).to.be.calledWithMatch(new RegExp(colorizedTimeWithDash));
        });

        it('should add action to log message if it was passed', () => {
            const action = 'test_action';

            logger.log(message, null, action);

            expect(consoleLogSpy).to.be.calledWithMatch(action);
        });

        it('should add scope to message if it was passed', () => {
            const scope = 'test_scope';

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(scope);
        });

        it('should wrap scope to blue color', () => {
            const scope = 'test_scope';
            const expectedScope = colors.blue(scope);

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should wrap scope part after last : into magenta color, excluding last :', () => {
            const scope = 'test_scope:trailing_part';
            const expectedScope = colors.blue(scope.replace(/(:.+)$/, (s, g) => colors.magenta(g.substr(1))));

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should wrap scope into [ ]', () => {
            const scope = 'test_scope';
            const expectedScope = `[${colors.blue(scope)}]`;

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should add message to log output', () => {
            logger.log(message);

            expect(consoleLogSpy).to.be.calledWithMatch(message);
        });
    });

    describe('logAction', () => {
        let action;
        let target;
        let additionalInfo;

        before(() => {
            action = 'test_action';
            target = 'test_target';
            additionalInfo = 'test_additional_info';
        });

        it('should log additional info', () => {
            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(additionalInfo);
        });

        it('should colorize additional info with grey color', () => {
            const colorizedAdditionalInfo = colors.grey(additionalInfo);

            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(colorizedAdditionalInfo);
        });

        it('should log target', () => {
            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(target);
        });

        it('should unite target with scope dividing them with path.sep if logger has scope', () => {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);
            const expectedScope = scope + path.sep + target;

            loggerWithScope.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should log action', () => {
            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(action);
        });

        it('should colorize action with green color', () => {
            const colorizedAction = colors.green(action);

            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(colorizedAction);
        });

        it('should wrap action into []', () => {
            const formattedAction = `[${colors.green(action)}]`;

            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(formattedAction);
        });
    });

    describe('logWarningAction', () => {
        let action;
        let target;
        let message;

        before(() => {
            action = 'test_action';
            target = 'test_target';
            message = 'test_message';
        });

        it('should not log warning if warnings disabled', () => {
            const disabledWarningsLogger = new Logger(null, { hideWarnings: true });

            disabledWarningsLogger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.not.called;
        });

        it('should log message', () => {
            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(message);
        });

        it('should log target', () => {
            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(target);
        });

        it('should unite target with scope dividing them with path.sep if logger has scope', () => {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);
            const expectedScope = scope + path.sep + target;

            loggerWithScope.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should log action', () => {
            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(action);
        });

        it('should colorize action with yellow color', () => {
            const colorizedAction = colors.yellow(action);

            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(colorizedAction);
        });

        it('should wrap action into []', () => {
            const formattedAction = `[${colors.yellow(action)}]`;

            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(formattedAction);
        });
    });

    describe('logTechIsDeprecated', () => {
        let target;
        let deprecatedTech;
        let thisPackage;
        let newTech;
        let newPackage;
        let description;

        before(() => {
            target = 'target';
            deprecatedTech = 'deprecated_tech';
            thisPackage = 'this_package';
            newTech = 'new_tech';
            newPackage = 'new_package';
            description = 'test_description';
        });

        it('should not log tech deprecated if warnings disabled', () => {
            const disabledWarningsLogger = new Logger(null, { hideWarnings: true });

            disabledWarningsLogger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage,
                description);

            expect(consoleWarnSpy).to.be.not.called;
        });

        it('should add \'deprecated\' action to log message', () => {
            const deprecated = `[${colors.yellow('deprecated').replace()}]`;

            logger.logTechIsDeprecated();

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecated);
        });

        it('should log target', () => {
            logger.logTechIsDeprecated(target);

            expect(consoleWarnSpy).to.be.calledWithMatch(target);
        });

        it('should log deprecated tech', () => {
            logger.logTechIsDeprecated(null, deprecatedTech);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecatedTech);
        });

        it('should log this package name', () => {
            logger.logTechIsDeprecated(null, null, thisPackage);

            expect(consoleWarnSpy).to.be.calledWithMatch(thisPackage);
        });

        it ('should log new tech and new package name together', () => {
            logger.logTechIsDeprecated(null, null, null, newTech, newPackage);

            expect(consoleWarnSpy).to.be.calledWithMatch(newTech)
                .and.to.be.calledWithMatch(newPackage);
        });

        it('should format deprecated tech message for same packages as \'Tech %old_tech_path% is deprecated. ' +
            'Use tech %new_tech_path% instead.\'', () => {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, thisPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedTech.samePackagesMessage);
        });

        it('should format deprecated tech message for different packages as \'Tech %old_tech_path% is deprecated. ' +
            'Install package %new_package_name% and use tech %new_tech_path% instead.\'', () => {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedTech.differentPackagesMessage);
        });

        it('should log old tech path in format %this_package%/techs/%deprecated_tech%', () => {
            const oldTechPath = `${thisPackage}/techs/${deprecatedTech}`;

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(oldTechPath);
        });

        it('should make old tech path bold', () => {
            const colorizedOldTechPath = colors.bold(`${thisPackage}/techs/${deprecatedTech}`);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(colorizedOldTechPath);
        });

        it('should log new package name', () => {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(newPackage);
        });

        it('should make new package name bold', () => {
            const boldNewPackageName = colors.bold(newPackage);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(boldNewPackageName);
        });

        it('should log new tech path in format %new_package%/techs/%new_tech%', () => {
            const newTechPath = `${newPackage}/techs/${newTech}`;

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(newTechPath);
        });

        it('should make new tech path bold', () => {
            const newTechPathBold = colors.bold(`${newPackage}/techs/${newTech}`);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(newTechPathBold);
        });

        it('should log description', () => {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(description);
        });

        it('should add description to the end of log message', () => {
            const regex = new RegExp(`${description}$`);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(regex);
        });
    });

    describe('logOptionIsDeprecated', () => {
        let target;
        let thisPackage;
        let tech;
        let deprecatedOption;
        let newOption;
        let description;

        before(() => {
            target = 'test_target';
            thisPackage = 'this_package';
            tech = 'test_tech';
            deprecatedOption = 'this_option';
            newOption = 'newOption';
            description = 'test_description';
        });

        it('should not log option deprecated if warnings disabled', () => {
            const disabledWarningsLogger = new Logger(null, { hideWarnings: true });

            disabledWarningsLogger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption,
                description);

            expect(consoleWarnSpy).to.not.be.called;
        });

        it('should add \'deprecated\' action to log message', () => {
            const deprecated = `[${colors.yellow('deprecated').replace()}]`;

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecated);
        });

        it('should log target', () => {
            logger.logOptionIsDeprecated(target);

            expect(consoleWarnSpy).to.be.calledWithMatch(target);
        });

        it('should log package', () => {
            logger.logOptionIsDeprecated(null, thisPackage);

            expect(consoleWarnSpy).to.be.calledWithMatch(thisPackage);
        });

        it('should log tech', () => {
            logger.logOptionIsDeprecated(null, null, tech);

            expect(consoleWarnSpy).to.be.calledWithMatch(tech);
        });

        it('should log deprecated option', () => {
            logger.logOptionIsDeprecated(null, null, null, deprecatedOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecatedOption);
        });

        it('should make deprecated option bold', () => {
            const deprecatedOptionBold = colors.bold(deprecatedOption);
            logger.logOptionIsDeprecated(null, null, null, deprecatedOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecatedOptionBold);
        });

        it('should log new option', () => {
            logger.logOptionIsDeprecated(null, null, null, null, newOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(newOption);
        });

        it('should make new option bold', () => {
            const newOptionBold = colors.bold(newOption);
            logger.logOptionIsDeprecated(null, null, null, null, newOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(newOptionBold);
        });

        it('should format deprecated option message as \'Option %deprecated_option% of %tech_path% is deprecated.\' ' +
            'when new option is not available', () => {
            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, null, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedOption.newOptionUnavailable);
        });

        it('should format deprecated option message as \'Option %deprecated_option% of %tech_path% is deprecated. ' +
            'Use option %new_option% instead.\' when new option is not available', () => {
            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedOption.newOptionAvailable);
        });

        it('should log tech path in format \'%package_name%/techs/%tech_name%\'', () => {
            const techPath = `${thisPackage}/techs/${tech}`;

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(techPath);
        });

        it('should make tech path bold', () => {
            const boldTechPath = colors.bold(`${thisPackage}/techs/${tech}`);

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(boldTechPath);
        });

        it('should log description', () => {
            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(description);
        });

        it('should add description to the end of the message', () => {
            const regex = new RegExp(`${description}$`);

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(regex);
        });
    });

    describe('logErrorAction', () => {
        let action;
        let target;
        let additionalInfo;

        before(() => {
            action = 'test_action';
            target = 'test_target';
            additionalInfo = 'test_additional_info';
        });

        it('should log action', () => {
            logger.logErrorAction(action);

            expect(consoleErrorSpy).to.be.calledWithMatch(action);
        });

        it('should colorize action in red color', () => {
            const colorizedAction = colors.red(action);

            logger.logErrorAction(action);

            expect(consoleErrorSpy).to.be.calledWithMatch(colorizedAction);
        });

        it('should wrap action into []', () => {
            const formattedAction = `[${colors.red(action)}]`;

            logger.logErrorAction(action);

            expect(consoleErrorSpy).to.be.calledWithMatch(formattedAction);
        });

        it('should log target', () => {
            logger.logErrorAction(null, target);

            expect(consoleErrorSpy).to.be.calledWithMatch(target);
        });

        it('should unite target with scope dividing them with path.sep if logger has scope', () => {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);
            const expectedScope = scope + path.sep + target;

            loggerWithScope.logErrorAction(action, target, message);

            expect(consoleErrorSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should log additional info', () => {
            logger.logErrorAction(null, null, additionalInfo);

            expect(consoleErrorSpy).to.be.calledWithMatch(additionalInfo);
        });

        it('should colorize addition info in grey color', () => {
            const colorizedAdditionalInfo = colors.grey(additionalInfo);

            logger.logErrorAction(null, null, additionalInfo);

            expect(consoleErrorSpy).to.be.calledWithMatch(colorizedAdditionalInfo);
        });
    });

    describe('isValid', () => {
        let target;
        let tech;

        before(() => {
            target = 'test_target';
            tech = 'test_tech';
        });

        it('shoud log \'isValid\' message', () => {
            logger.isValid();

            expect(consoleLogSpy).to.be.calledWithMatch('isValid');
        });

        it('should log target', () => {
            logger.isValid(target);

            expect(consoleLogSpy).to.be.calledWithMatch(target);
        });

        it('should log tech', () => {
            logger.isValid(null, tech);

            expect(consoleLogSpy).to.be.calledWithMatch(tech);
        });
    });

    describe('logClean', () => {
        let target;

        before(() => {
            target = 'test_target';
        });

        it('shoud log \'clean\' message', () => {
            logger.logClean();

            expect(consoleLogSpy).to.be.calledWithMatch('clean');
        });

        it('should log target', () => {
            logger.logClean(target);

            expect(consoleLogSpy).to.be.calledWithMatch(target);
        });
    });

    describe('subLogger', () => {
        const scope = 'test_scope';

        it('should return new Logger instance', () => {
            expect(logger.subLogger(scope)).to.be.instanceOf(Logger);
        });

        it('should assign scope passed in params to new logger', () => {
            const subLogger = logger.subLogger(scope);

            expect(subLogger._scope).to.be.equal(scope);
        });

        it('should add self logger scope to new scope dividing them with path.sep', () => {
            const newScope = 'new_scope';
            const loggerWithScope = new Logger(scope);
            const subLogger = loggerWithScope.subLogger(newScope);

            expect(subLogger._scope).to.be.equal(scope + path.sep + newScope);
        });

        it('should pass own options to sublogger', () => {
            const options = { hideWarnings: true };
            const loggerWithOptions = new Logger(null, options);
            const sublogger =  loggerWithOptions.subLogger(scope);

            expect(sublogger._options).to.be.deep.equal(options);
        });

        it('should pass own permission for logging to sublogger', () => {
            const newLogger = new Logger();
            newLogger.setEnabled(false);
            const sublogger = newLogger.subLogger(scope);

            expect(sublogger.isEnabled()).to.be.equal(newLogger.isEnabled());
        });
    });
});
