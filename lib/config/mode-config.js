var inherit = require('inherit');

module.exports = inherit(require('./configurable'), {
    __constructor: function(modeName) {
        this.__base();
        this._name = modeName;
    }
});