var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./css'), {
    getName: function() {
        return 'css-ie6';
    },
    getDestSuffixes: function() {
        return ['ie6.css'];
    },
    getSourceSuffixes: function() {
        return ['ie6.css'];
    }
});
