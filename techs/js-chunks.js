var inherit = require('inherit');

module.exports = inherit(require('../lib/tech/chunks.js'), {
    getName: function() {
        return 'js-chunks';
    },
    getDestSuffixes: function() {
        return ['js-chunks.js'];
    },
    getSourceSuffixes: function() {
        return ['js'];
    }
});
