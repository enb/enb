/**
 * bemhtml
 * =======
 *
 * Технология устарела. Новая версия в пакете `enb-bemhtml`.
 *
 * Склеивает *bemhtml*-файлы по deps'ам, обрабатывает BEMHTML-транслятором, сохраняет в виде `?.bemhtml.js`. Использует пакет `bemc` (https://github.com/bem/bemc).
 *
 * Имя результирующего файла в этой версии не настраивается.
 *
 * **Опции**
 *
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **exportName** — Имя переменной-обработчика BEMHTML. По умолчанию — `'BEMHTML'`.
 * * *Boolean* **devMode** — Development-режим. По умолчанию — `true`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/bemhtml'));
 * ```
 */
var inherit = require('inherit'),
    fs = require('graceful-fs'),
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
                _this.node.getLogger().logWarningAction(
                    'deprecated',
                    '\n\n' +
                    '    Tech "enb/techs/bemhtml" is deprecated. Please install npm module "enb-bemhtml" and switch to "enb-bemhtml/techs/bemhtml" tech.\n' +
                    '    BEMHTML support will be removed from "enb" package soon.\n'
                );
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
