var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./css'), {
    getName: function() {
        return 'css-ie7';
    },
    getDestSuffixes: function() {
        return ['ie7.css'];
    },
    getSourceSuffixes: function() {
        return ['ie7.css'];
    }
});
