var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./css-includes'), {
    getDestSuffixes: function() {
        return ['ie.css'];
    },
    getSourceSuffixes: function() {
        return ['ie.css'];
    }
});
