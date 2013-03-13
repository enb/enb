var inherit = require('inherit'),
    Vow = require('vow');

module.exports = inherit({
    __constructor: function(options) {
        this._options = options || {};
    },

    init: function(node) {
        this.node = node;
        this.configure();
    },

    configure: function() {},

    getOption: function(key, defaultValue) {
        return this._options.hasOwnProperty(key) ? this._options[key] : defaultValue;
    },

    getRequiredOption: function(key) {
        if (!this._options.hasOwnProperty(key)) {
            throw Error('Option "' + key + '" is required for technology "' + this.getName() + '".');
        }
        return this._options[key];
    },

    getName: function() {
        throw new Error('You are required to override getName method of BaseTech.')
    },

    clean: function() {
        var _this = this;
        return Vow.all(this.getTargets().map(function(target) {
            _this.node.cleanTargetFile(target);
        }));
    }
});