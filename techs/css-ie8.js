var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./css'), {
    getName: function() {
        return 'css-ie8';
    },
    getDestSuffixes: function() {
        return ['ie8.css'];
    },
    getSourceSuffixes: function() {
        return ['ie8.css'];
    }
});
