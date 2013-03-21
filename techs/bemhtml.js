var inherit = require('inherit'),
    fs = require('fs'),
    path = require('path'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    bemc = require('bemc');

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
        var _this = this;
        return Vow.all(sourceFiles.map(function(file) {
            return vowFs.read(file.fullname, 'utf8');
        }))
        .then(function(sources) {
            _this.node.getLogger().log('Calm down, OmetaJS is running...');
            var bemhtmlProcessor = BemhtmlProcessor.fork();
            return bemhtmlProcessor.process(sources.join('\n'), _this._exportName, _this._devMode).then(function(res) {
                bemhtmlProcessor.dispose();
                return res;
            });
        });
    }
});

var BemhtmlProcessor = require('sibling').declare({
    process: function(source, exportName, devMode) {
        return bemc.translate(source, {
            exportName: exportName,
            devMode: devMode
        });
    }
});