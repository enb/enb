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

describe('logger', function () {
    let logger;
    let consoleLogSpy;
    let consoleWarnSpy;
    let consoleErrorSpy;
    let message;

    before(function () {
        // spying at console methods because logger built on top of it
        consoleLogSpy = sinon.spy(console, 'log');
        consoleWarnSpy = sinon.spy(console, 'warn');
        consoleErrorSpy = sinon.spy(console, 'error');
        logger = new Logger();
        message = 'test_message';
    });

    beforeEach(function () {
        consoleLogSpy.reset();
        consoleWarnSpy.reset();
        consoleErrorSpy.reset();
    });

    after(function () {
        consoleLogSpy.restore();
        consoleWarnSpy.restore();
        consoleErrorSpy.restore();
    });

    describe('constructor', function () {
        it('should set scope passed in params', function () {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);

            expect(loggerWithScope._scope).to.be.equal(scope);
        });

        it('should make logger enabled by default', function () {
            const newLogger = new Logger();

            expect(newLogger.isEnabled()).to.be.true;
        });

        it('should set options passed in params', function () {
            const options = { hideWarnings: true };
            const loggerWithOptions = new Logger(null, options);

            expect(loggerWithOptions._options).to.be.deep.equal(options);
        });
    });

    describe('log', function () {
        it('should not log message if logger disabled', function () {
            const disabledLogger = new Logger();

            disabledLogger.setEnabled(false);
            disabledLogger.log(message);

            expect(consoleLogSpy).to.be.not.called;
        });

        it('should add time to log in format HH:mm:ss.AAA', function () {
            logger.log(message);

            expect(consoleLogSpy).to.be.calledWithMatch(REGEX.time);
        });

        it('should colorize time with grey color by default', function () {
            const timeWithDash = `${REGEX.time.toString().replace(/\//g, '')} - `;
            const colorizedTimeWithDash = colors.grey(timeWithDash).replace(/\[/g, '\\[');

            logger.log(message);

            expect(consoleLogSpy).to.be.calledWithMatch(new RegExp(colorizedTimeWithDash));
        });

        it('should add action to log message if it was passed', function () {
            const action = 'test_action';

            logger.log(message, null, action);

            expect(consoleLogSpy).to.be.calledWithMatch(action);
        });

        it('should add scope to message if it was passed', function () {
            const scope = 'test_scope';

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(scope);
        });

        it('should wrap scope to blue color', function () {
            const scope = 'test_scope';
            const expectedScope = colors.blue(scope);

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should wrap scope part after last : into magenta color, excluding last :', function () {
            const scope = 'test_scope:trailing_part';
            const expectedScope = colors.blue(scope.replace(/(:.+)$/, function (s, g) {
                return colors.magenta(g.substr(1));
            }));

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should wrap scope into [ ]', function () {
            const scope = 'test_scope';
            const expectedScope = `[${colors.blue(scope)}]`;

            logger.log(message, scope);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should add message to log output', function () {
            logger.log(message);

            expect(consoleLogSpy).to.be.calledWithMatch(message);
        });
    });

    describe('logAction', function () {
        let action;
        let target;
        let additionalInfo;

        before(function () {
            action = 'test_action';
            target = 'test_target';
            additionalInfo = 'test_additional_info';
        });

        it('should log additional info', function () {
            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(additionalInfo);
        });

        it('should colorize additional info with grey color', function () {
            const colorizedAdditionalInfo = colors.grey(additionalInfo);

            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(colorizedAdditionalInfo);
        });

        it('should log target', function () {
            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(target);
        });

        it('should unite target with scope dividing them with path.sep if logger has scope', function () {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);
            const expectedScope = scope + path.sep + target;

            loggerWithScope.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should log action', function () {
            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(action);
        });

        it('should colorize action with green color', function () {
            const colorizedAction = colors.green(action);

            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(colorizedAction);
        });

        it('should wrap action into []', function () {
            const formattedAction = `[${colors.green(action)}]`;

            logger.logAction(action, target, additionalInfo);

            expect(consoleLogSpy).to.be.calledWithMatch(formattedAction);
        });
    });

    describe('logWarningAction', function () {
        let action;
        let target;
        let message;

        before(function () {
            action = 'test_action';
            target = 'test_target';
            message = 'test_message';
        });

        it('should not log warning if warnings disabled', function () {
            const disabledWarningsLogger = new Logger(null, { hideWarnings: true });

            disabledWarningsLogger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.not.called;
        });

        it('should log message', function () {
            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(message);
        });

        it('should log target', function () {
            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(target);
        });

        it('should unite target with scope dividing them with path.sep if logger has scope', function () {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);
            const expectedScope = scope + path.sep + target;

            loggerWithScope.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should log action', function () {
            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(action);
        });

        it('should colorize action with yellow color', function () {
            const colorizedAction = colors.yellow(action);

            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(colorizedAction);
        });

        it('should wrap action into []', function () {
            const formattedAction = `[${colors.yellow(action)}]`;

            logger.logWarningAction(action, target, message);

            expect(consoleWarnSpy).to.be.calledWithMatch(formattedAction);
        });
    });

    describe('logTechIsDeprecated', function () {
        let target;
        let deprecatedTech;
        let thisPackage;
        let newTech;
        let newPackage;
        let description;

        before(function () {
            target = 'target';
            deprecatedTech = 'deprecated_tech';
            thisPackage = 'this_package';
            newTech = 'new_tech';
            newPackage = 'new_package';
            description = 'test_description';
        });

        it('should not log tech deprecated if warnings disabled', function () {
            const disabledWarningsLogger = new Logger(null, { hideWarnings: true });

            disabledWarningsLogger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage,
                description);

            expect(consoleWarnSpy).to.be.not.called;
        });

        it('should add \'deprecated\' action to log message', function () {
            const deprecated = `[${colors.yellow('deprecated').replace()}]`;

            logger.logTechIsDeprecated();

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecated);
        });

        it('should log target', function () {
            logger.logTechIsDeprecated(target);

            expect(consoleWarnSpy).to.be.calledWithMatch(target);
        });

        it('should log deprecated tech', function () {
            logger.logTechIsDeprecated(null, deprecatedTech);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecatedTech);
        });

        it('should log this package name', function () {
            logger.logTechIsDeprecated(null, null, thisPackage);

            expect(consoleWarnSpy).to.be.calledWithMatch(thisPackage);
        });

        it ('should log new tech and new package name together', function () {
            logger.logTechIsDeprecated(null, null, null, newTech, newPackage);

            expect(consoleWarnSpy).to.be.calledWithMatch(newTech)
                .and.to.be.calledWithMatch(newPackage);
        });

        it('should format deprecated tech message for same packages as \'Tech %old_tech_path% is deprecated. ' +
            'Use tech %new_tech_path% instead.\'', function () {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, thisPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedTech.samePackagesMessage);
        });

        it('should format deprecated tech message for different packages as \'Tech %old_tech_path% is deprecated. ' +
            'Install package %new_package_name% and use tech %new_tech_path% instead.\'', function () {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedTech.differentPackagesMessage);
        });

        it('should log old tech path in format %this_package%/techs/%deprecated_tech%', function () {
            const oldTechPath = `${thisPackage}/techs/${deprecatedTech}`;

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(oldTechPath);
        });

        it('should make old tech path bold', function () {
            const colorizedOldTechPath = colors.bold(`${thisPackage}/techs/${deprecatedTech}`);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(colorizedOldTechPath);
        });

        it('should log new package name', function () {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(newPackage);
        });

        it('should make new package name bold', function () {
            const boldNewPackageName = colors.bold(newPackage);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(boldNewPackageName);
        });

        it('should log new tech path in format %new_package%/techs/%new_tech%', function () {
            const newTechPath = `${newPackage}/techs/${newTech}`;

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(newTechPath);
        });

        it('should make new tech path bold', function () {
            const newTechPathBold = colors.bold(`${newPackage}/techs/${newTech}`);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(newTechPathBold);
        });

        it('should log description', function () {
            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(description);
        });

        it('should add description to the end of log message', function () {
            const regex = new RegExp(`${description}$`);

            logger.logTechIsDeprecated(target, deprecatedTech, thisPackage, newTech, newPackage, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(regex);
        });
    });

    describe('logOptionIsDeprecated', function () {
        let target;
        let thisPackage;
        let tech;
        let deprecatedOption;
        let newOption;
        let description;

        before(function () {
            target = 'test_target';
            thisPackage = 'this_package';
            tech = 'test_tech';
            deprecatedOption = 'this_option';
            newOption = 'newOption';
            description = 'test_description';
        });

        it('should not log option deprecated if warnings disabled', function () {
            const disabledWarningsLogger = new Logger(null, { hideWarnings: true });

            disabledWarningsLogger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption,
                description);

            expect(consoleWarnSpy).to.not.be.called;
        });

        it('should add \'deprecated\' action to log message', function () {
            const deprecated = `[${colors.yellow('deprecated').replace()}]`;

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecated);
        });

        it('should log target', function () {
            logger.logOptionIsDeprecated(target);

            expect(consoleWarnSpy).to.be.calledWithMatch(target);
        });

        it('should log package', function () {
            logger.logOptionIsDeprecated(null, thisPackage);

            expect(consoleWarnSpy).to.be.calledWithMatch(thisPackage);
        });

        it('should log tech', function () {
            logger.logOptionIsDeprecated(null, null, tech);

            expect(consoleWarnSpy).to.be.calledWithMatch(tech);
        });

        it('should log deprecated option', function () {
            logger.logOptionIsDeprecated(null, null, null, deprecatedOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecatedOption);
        });

        it('should make deprecated option bold', function () {
            const deprecatedOptionBold = colors.bold(deprecatedOption);
            logger.logOptionIsDeprecated(null, null, null, deprecatedOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(deprecatedOptionBold);
        });

        it('should log new option', function () {
            logger.logOptionIsDeprecated(null, null, null, null, newOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(newOption);
        });

        it('should make new option bold', function () {
            const newOptionBold = colors.bold(newOption);
            logger.logOptionIsDeprecated(null, null, null, null, newOption);

            expect(consoleWarnSpy).to.be.calledWithMatch(newOptionBold);
        });

        it('should format deprecated option message as \'Option %deprecated_option% of %tech_path% is deprecated.\' ' +
            'when new option is not available', function () {
            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, null, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedOption.newOptionUnavailable);
        });

        it('should format deprecated option message as \'Option %deprecated_option% of %tech_path% is deprecated. ' +
            'Use option %new_option% instead.\' when new option is not available', function () {
            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(REGEX.deprecatedOption.newOptionAvailable);
        });

        it('should log tech path in format \'%package_name%/techs/%tech_name%\'', function () {
            const techPath = `${thisPackage}/techs/${tech}`;

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(techPath);
        });

        it('should make tech path bold', function () {
            const boldTechPath = colors.bold(`${thisPackage}/techs/${tech}`);

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(boldTechPath);
        });

        it('should log description', function () {
            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(description);
        });

        it('should add description to the end of the message', function () {
            const regex = new RegExp(`${description}$`);

            logger.logOptionIsDeprecated(target, thisPackage, tech, deprecatedOption, newOption, description);

            expect(consoleWarnSpy).to.be.calledWithMatch(regex);
        });
    });

    describe('logErrorAction', function () {
        let action;
        let target;
        let additionalInfo;

        before(function () {
            action = 'test_action';
            target = 'test_target';
            additionalInfo = 'test_additional_info';
        });

        it('should log action', function () {
            logger.logErrorAction(action);

            expect(consoleErrorSpy).to.be.calledWithMatch(action);
        });

        it('should colorize action in red color', function () {
            const colorizedAction = colors.red(action);

            logger.logErrorAction(action);

            expect(consoleErrorSpy).to.be.calledWithMatch(colorizedAction);
        });

        it('should wrap action into []', function () {
            const formattedAction = `[${colors.red(action)}]`;

            logger.logErrorAction(action);

            expect(consoleErrorSpy).to.be.calledWithMatch(formattedAction);
        });

        it('should log target', function () {
            logger.logErrorAction(null, target);

            expect(consoleErrorSpy).to.be.calledWithMatch(target);
        });

        it('should unite target with scope dividing them with path.sep if logger has scope', function () {
            const scope = 'test_scope';
            const loggerWithScope = new Logger(scope);
            const expectedScope = scope + path.sep + target;

            loggerWithScope.logErrorAction(action, target, message);

            expect(consoleErrorSpy).to.be.calledWithMatch(expectedScope);
        });

        it('should log additional info', function () {
            logger.logErrorAction(null, null, additionalInfo);

            expect(consoleErrorSpy).to.be.calledWithMatch(additionalInfo);
        });

        it('should colorize addition info in grey color', function () {
            const colorizedAdditionalInfo = colors.grey(additionalInfo);

            logger.logErrorAction(null, null, additionalInfo);

            expect(consoleErrorSpy).to.be.calledWithMatch(colorizedAdditionalInfo);
        });
    });

    describe('isValid', function () {
        let target;
        let tech;

        before(function () {
            target = 'test_target';
            tech = 'test_tech';
        });

        it('shoud log \'isValid\' message', function () {
            logger.isValid();

            expect(consoleLogSpy).to.be.calledWithMatch('isValid');
        });

        it('should log target', function () {
            logger.isValid(target);

            expect(consoleLogSpy).to.be.calledWithMatch(target);
        });

        it('should log tech', function () {
            logger.isValid(null, tech);

            expect(consoleLogSpy).to.be.calledWithMatch(tech);
        });
    });

    describe('logClean', function () {
        let target;

        before(function () {
            target = 'test_target';
        });

        it('shoud log \'clean\' message', function () {
            logger.logClean();

            expect(consoleLogSpy).to.be.calledWithMatch('clean');
        });

        it('should log target', function () {
            logger.logClean(target);

            expect(consoleLogSpy).to.be.calledWithMatch(target);
        });
    });

    describe('subLogger', function () {
        const scope = 'test_scope';

        it('should return new Logger instance', function () {
            expect(logger.subLogger(scope)).to.be.instanceOf(Logger);
        });

        it('should assign scope passed in params to new logger', function () {
            const subLogger = logger.subLogger(scope);

            expect(subLogger._scope).to.be.equal(scope);
        });

        it('should add self logger scope to new scope dividing them with path.sep', function () {
            const newScope = 'new_scope';
            const loggerWithScope = new Logger(scope);
            const subLogger = loggerWithScope.subLogger(newScope);

            expect(subLogger._scope).to.be.equal(scope + path.sep + newScope);
        });

        it('should pass own options to sublogger', function () {
            const options = { hideWarnings: true };
            const loggerWithOptions = new Logger(null, options);
            const sublogger =  loggerWithOptions.subLogger(scope);

            expect(sublogger._options).to.be.deep.equal(options);
        });

        it('should pass own permission for logging to sublogger', function () {
            const newLogger = new Logger();
            newLogger.setEnabled(false);
            const sublogger = newLogger.subLogger(scope);

            expect(sublogger.isEnabled()).to.be.equal(newLogger.isEnabled());
        });
    });
});
