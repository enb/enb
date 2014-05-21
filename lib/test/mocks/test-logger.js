var inherit = require('inherit');

var TestLogger = inherit({
    __constructor: function (scope) {
        this._messages = [];
        this._enabled = true;
        this._scope = scope || '';
    },
    log: function (msg, scope, action) {
        if (this._enabled) {
            this._messages.push({
                message: msg,
                scope: scope,
                action: action
            });
        }
    },
    logAction: function (action, target, additionalInfo) {
        this.log(
            additionalInfo,
            (this._scope && (this._scope + '/')) + target,
            action
        );
    },
    logTechIsDeprecated: function (deprecatedTech, thisPackage, newTech, newPackage, desc) {
        this.logWarningAction('deprecated',
            'Tech ' + thisPackage + '/techs/' + deprecatedTech + ' is deprecated.' +
            (newTech && newPackage ?
                ' ' +
                (newPackage === thisPackage ?
                    'Use ' :
                    'Install package ' + newPackage + ' and use '
                    ) +
                'tech ' + newPackage + '/techs/' + newTech + ' instead' :
                ''
                ) +
            desc
        );
    },
    logWarningAction: function (action, msg) {
        this.log(action, '', msg);
    },
    logErrorAction: function (action, target, additionalInfo) {
        this.log(
            additionalInfo,
            (this._scope && (this._scope + '/')) + target,
            action
        );
    },
    isValid: function (target, tech) {
        this.logAction('isValid', target, tech);
    },
    logClean: function (target) {
        this.logAction('clean', target);
    },
    setEnabled: function (enabled) {
        this._enabled = enabled;
    },
    isEnabled: function () {
        return this._enabled;
    },
    subLogger: function (scope) {
        var res = new TestLogger(this._scope + (scope.charAt(0) === ':' ? scope : (this._scope && '/') + scope));
        res.setEnabled(this._enabled);
        return res;
    }
});

module.exports = TestLogger;
