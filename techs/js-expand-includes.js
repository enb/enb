/**
 * js-expand-includes
 * ==================
 *
 * Обрабатывает инклуды в исходном `js`-файле и собирает результирующий файл.
 * При раскрытии инклудов, если имя подключенного файла является таргетом, то ждет его выполнения.
 *
 * **Опции**
 *
 * * *String* **sourceTarget** — Исходный JS-таргет. Обязательная опция.
 * * *String* **destTarget** — Результирующий JS-таргет. Обязательная опция.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([
 *    require('enb/techs/js-expand-includes'),
 *    { sourceTarget: '?.run-tests.js', destTarget: '_?.run-tests.js' }
 * ]);
 * ```
 */
var fs = require('graceful-fs'),
    Vow = require('vow'),
    vowFs = require('../lib/fs/async-fs'),
    inherit = require('inherit'),
    path = require('path');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'js-expand-includes';
    },

    configure: function() {
        this._source = this.getRequiredOption('sourceTarget');
        this._target = this.getRequiredOption('destTarget');
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    // TODO: Кеширование?
    build: function() {
        var target = this.node.unmaskTargetName(this._target),
            targetPath = this.node.resolvePath(target),
            source = this.node.unmaskTargetName(this._source),
            sourcePath = this.node.resolvePath(source),
            _this = this;
        return this.node.requireSources([source]).then(function() {
                return vowFs.read(sourcePath, 'utf8').then(function(data) {
                    return Vow.when(_this._processIncludesPromised(data, targetPath)).then(function(data) {
                        return vowFs.write(targetPath, data, 'utf8').then(function() {
                            _this.node.resolveTarget(target);
                        });
                    });
                });
        });
    },

    _processIncludesPromised: function(data, filename) {
        var _this = this,
            targetsToWaitFor = [],
            regex = /include\(["']([^"']+)["']\);/g,
            match;
        while (!!(match = regex.exec(data))) {
            if (this.node.hasRegisteredTarget(match[1])) {
                targetsToWaitFor.push(match[1]);
            }
        }
        return Vow.when(targetsToWaitFor.length ? this.node.requireSources(targetsToWaitFor) : null)
            .then(function() {
                return _this._processIncludes(data, filename);
            });
    },

    _processIncludes: function(data, filename) {
        var _this = this;
        return data.replace(/([^\.]|^)include\(["']([^"']+)["']\);/g, function(s, preChar, url) {
            var importFilename = path.resolve(path.dirname(filename), url),
                rootRelImportFilename = importFilename.slice(1),
                pre = preChar + '/* ' + rootRelImportFilename + ': begin */ /**/\n',
                post = '\n/* ' + rootRelImportFilename + ': end */ /**/\n';
            return pre +
                '    ' +
                _this._processIncludes(fs.readFileSync(importFilename, "utf8"), importFilename)
                    .replace(/\n/g, '\n    ') +
                post;
        });
    }
});
