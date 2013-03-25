var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./css'), {
    getName: function() {
        return 'css-ie9';
    },
    getDestSuffixes: function() {
        return ['ie9.css'];
    },
    getSourceSuffixes: function() {
        return ['ie9.css'];
    }
});
