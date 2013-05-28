/**
 * bemhtml
 * =======
 *
 * Технология перенесена в пакет `enb-bemhtml`.
 */
var inherit = require('inherit');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {

    configure: function() {
        this._exportName = this.getOption('exportName', 'BEMHTML');
        this._devMode = this.getOption('devMode', true);
    },

    getName: function() {
        return 'bemhtml';
    },

    getDestSuffixes: function() {
        return ['bemhtml.js'];
    },
    getSourceSuffixes: function() {
        return ['bemhtml'];
    },

    getBuildResult: function(sourceFiles, suffix) {
        var errMsg = 'bemhtml tech moved to enb-bemhtml package, please follow https://github.com/enb-make/enb-bemhtml.';
        this.node.getLogger().log(errMsg);
        throw new Error(errMsg);
    }
});
