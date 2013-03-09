var inherit = require('inherit'),
    Vow = require('vow');

module.exports = inherit({
    __constructor: function() {
        this._chains = [];
    },

    addChain: function(cb) {
        this._chains.push(cb);
    },

    exec: function(args, thisObject) {
        args = [thisObject || this].concat(args || []);
        var chains = this._chains.slice(0);
        function keepRunning() {
            var chain = chains.shift();
            return chain && Vow.when(chain.apply(this, args)).then(function() {
                return keepRunning();
            });
        }
        return keepRunning();
    }
});