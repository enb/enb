var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./css'), {
    getName: function() {
        return 'css-ie';
    },
    getDestSuffixes: function() {
        return ['ie.css'];
    },
    getSourceSuffixes: function() {
        return ['ie.css'];
    }
});
