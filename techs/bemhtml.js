var inherit = require('inherit'),
    fs = require('fs'),
    path = require('path'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    XJST = require('xjst');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {

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
            sources = sources.join('\n');

            // --- (C) Original BEM Tools
            // Someone PLEASE rewrite BEMHTML from OmetaJS to normal, pure JS.
            // TODO: Write lexer.
            // TODO: Build per-file AST-Cache.

            _this.node.getLogger().log('Calm down, OmetaJS is running...');

            var BEMHTML = require('../exlib/bemhtml');
            try {
                var tree = BEMHTML.BEMHTMLParser.matchAll(
                    sources,
                    'topLevel',
                    undefined,
                    function(m, i) {
                        console.log(arguments);
                        throw { errorPos: i, toString: function() { return "bemhtml match failed" } }
                    });

                var xjstSources = BEMHTML.BEMHTMLToXJST.match(
                    tree,
                    'topLevel',
                    undefined,
                    function(m, i) {
                        console.log(arguments);
                        throw { toString: function() { return "bemhtml to xjst compilation failed" } };
                    });
            } catch (e) {
                console.log('error: ' + e);
                throw e;
            }

            try {
                var xjstTree = XJST.parse(xjstSources);
            } catch (e) {
                throw new Error("xjst parse failed");
            }

            try {
                var xjstJS = process.env.BEMHTML_ENV == 'development' ?
                    XJST.XJSTCompiler.match(xjstTree, 'topLevel') :
                    XJST.compile(xjstTree);
            } catch (e) {
                throw new Error("xjst to js compilation failed");
            }

            return 'var BEMHTML = ' + xjstJS + '\n'
                + 'BEMHTML = (function(xjst) { return function() { return xjst.apply.call([this]); }; }(BEMHTML));\n'
                + 'typeof exports === "undefined" || (exports.BEMHTML = BEMHTML);';

        });
    }
});