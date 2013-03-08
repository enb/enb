var inherit = require('inherit');

module.exports = inherit({
    __constructor: function(name) {
        this._name = name;
        this._chains = [];
    },

    addChain: function(cb) {
        this._chains.push(cb);
    },

    _keepRunning: function() {
        var _this = this, chain = this._chains.shift();
        return chain && Vow.when(chain.apply(this, this._args)).then(function() {
            return _this._keepRunning();
        });
    },

    exec: function(args) {
        this._args = [this].concat(args || []);
        return this._keepRunning();
    }
});