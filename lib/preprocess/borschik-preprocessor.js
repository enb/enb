var inherit = require('inherit'),
    path = require('path'),
    fs = require('fs'),
    Vow = require('vow'),
    borschik = require('borschik');

module.exports = inherit({
    preprocessFile: function(sourceFilename, destFilename, freeze, minimize, tech) {
        var opts = {
            input: sourceFilename,
            output: destFilename,
            freeze: freeze,
            minimize: minimize
        };
        tech && (opts['tech'] = tech);
        return Vow.when(borschik.api(opts));
    }
});