var colors = require('colors'),
    inherit = require('inherit');

var Logger = module.exports = inherit({
    __constructor: function(scope) {
        this._scope = scope;
        this._enabled = true;
    },

    log: function(msg) {
        var dt = new Date();
        this._enabled && console.log(
            colors.grey(
                zeros(dt.getHours(), 2) + ':' +
                zeros(dt.getMinutes(), 2) + ':' +
                zeros(dt.getSeconds(), 2) + '.' +
                zeros(dt.getMilliseconds(), 3) + ' - '
            ) +
            '[' + colors.blue(
                this._scope.replace(/(:.+)$/, function(s, g) {
                    return colors.magenta(g);
                })
            ) + '] ' + msg
        );
    },

    logAction: function(action, msg, additionalInfo) {
        this.log('[' + colors.green(action) + '] ' + msg +
            (additionalInfo ? colors.grey(additionalInfo) : ''));
    },

    logWarningAction: function(action, msg) {
        this.log('[' + colors.yellow(action) + '] ' + msg);
    },

    logErrorAction: function(action, msg) {
        this.log('[' + colors.red(action) + '] ' + msg);
    },

    isValid: function(target) {
        this.logAction('isValid', target);
    },

    logClean: function(msg) {
        this.logAction('clean', msg);
    },

    setEnabled: function(enabled) {
        this._enabled = enabled;
    },

    isEnabled: function() {
        return this._enabled;
    },

    subLogger: function(name) {
        return new Logger(this._scope + (name.charAt(0) == ':' ? name : '/' + name));
    }
});

function zeros(s, l) {
    s = '' + s;
    while (s.length < l) {
        s = '0' + s;
    }
    return s;
}