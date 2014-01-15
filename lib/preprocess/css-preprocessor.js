/**
 * CssPreprocessor
 * ===============
 */
var inherit = require('inherit'),
    path = require('path'),
    fs = require('graceful-fs'),
    Vow = require('vow'),
    vowFs = require('../fs/async-fs');

/**
 * CssPreprocessor — класс для препроцессинга CSS. Заменяет import'ы на содержимое CSS-файлов,
 * изменяет url'ы картинок.
 * @name CssPreprocessor
 */
module.exports = inherit({

    /**
     * Конструктор.
     */
    __constructor: function () {
        this._buildCssRelativeUrl = function (url, filename) {
            return url;
        };
    },

    /**
     * Устанавливает функцию для построения относительных путей.
     * @var {Function} builder
     */
    setCssRelativeUrlBuilder: function (builder) {
        this._buildCssRelativeUrl = builder;
    },

    /**
     * Запускает препроцессинг.
     * @param {String} data CSS для препроцессинга.
     * @param {String} filename Имя результирующего файла.
     */
    preprocess: function (data, filename) {
        return this._processIncludes(this._processUrls(data, filename), filename);
    },

    /**
     * @returns {Promise}
     */
    preprocessIncludes: function (data, filename) {
        return this._processIncludes(data, filename);
    },

    _processUrls: function (data, filename) {
        var _this = this;
        return data
            .replace(/(?:@import\s*)?url\(('[^']+'|"[^"]+"|[^'")]+)\)/g, function (s, url) {
                if (s.indexOf('@import') === 0) {
                    return s;
                }
                // Тип кавычки
                var q = '';
                var firstChar = url.charAt(0);
                if (firstChar === '\'' || firstChar === '"') {
                    url = url.substr(1, url.length - 2);
                    q = firstChar;
                }
                return 'url(' + q + _this._resolveCssUrl(url, filename) + q + ')';
            }).replace(/src=[']?([^',\)]+)[']?/g, function (s, url) {
                return 'src=\'' + _this._resolveCssUrl(url, filename) + '\'';
            });
    },

    _resolveCssUrl: function (url, filename) {
        if (url.substr(0, 5) === 'data:' ||
            url.substr(0, 2) === '//' ||
            ~url.indexOf('http://') ||
            ~url.indexOf('https://')
        ) {
            return url;
        } else {
            return this._buildCssRelativeUrl(url, filename);
        }
    },
    _processIncludes: function (data, filename) {
        var _this = this;
        var filesToLoad = {};
        var regex = /@import\s*(?:url\()?["']?([^"'\)]+)["']?(?:\))?\s*;/g;
        var match;
        var loadPromises = [];
        function addLoadPromise (url) {
            var includedFilename = path.resolve(path.dirname(filename), url);
            loadPromises.push(vowFs.read(includedFilename, 'utf8').then(function (data) {
                return _this.preprocess(data, includedFilename).then(function (preprocessedData) {
                    filesToLoad[url] = preprocessedData;
                });
            }));
        }
        while (!!(match = regex.exec(data))) {
            addLoadPromise(match[1]);
        }
        return Vow.all(loadPromises).then(function () {
            return data.replace(/@import\s*(?:url\()?["']?([^"'\)]+)["']?(?:\))?\s*;/g, function (s, url) {
                var pre = '/* ' + url + ': begin */ /**/\n',
                    post = '\n/* ' + url + ': end */ /**/\n';
                return pre + '    ' + filesToLoad[url].replace(/\n/g, '\n    ') + post;
            });
        });
    }
});
