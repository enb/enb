var inherit = require('inherit');

module.exports = inherit(require('./configurable'), {
    __constructor: function(mask) {
        this.__base();
        this._mask = mask;
    },
    getMask: function() {
        return this._mask;
    }
});