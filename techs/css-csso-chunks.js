var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    path = require('path'),
    crypto = require('crypto'),
    csso = require('csso');

module.exports = inherit(require('./css-chunks'), {
    getName: function() {
        return 'css-csso-chunks';
    },
    _processChunkData: function(sourceFile, data, suffix) {
        return csso.justDoIt(this.__base(sourceFile, data, suffix), true);
    }
});
