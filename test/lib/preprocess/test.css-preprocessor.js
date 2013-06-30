var CSSPreprocessor = require('../../../lib/preprocess/css-preprocessor');
require('chai').should();

describe('lib', function() {
    describe('preprocess', function() {
        describe('css-preprocessor', function() {
            var cssPreprocessor;
            beforeEach(function() {
                cssPreprocessor = new CSSPreprocessor();
            });
            it('should process relative image urls', function(next) {
                cssPreprocessor.setCssRelativeUrlBuilder(function(url, filename) {
                    return filename + '#' + url;
                });
                cssPreprocessor.preprocess(
                    'div { background: url(1.png); }', '1.css'
                ).then(function(css) {
                    css.should.equal('div { background: url(1.css#1.png); }');
                    next();
                }).fail(function(e) {
                    next(e);
                });
            });
            it('should preserve quote type', function(next) {
                cssPreprocessor.setCssRelativeUrlBuilder(function(url, filename) {
                    return filename + '#' + url;
                });
                cssPreprocessor.preprocess(
                    'div { background: url(\'1.png\'); }', '1.css'
                ).then(function(css) {
                    css.should.equal('div { background: url(\'1.css#1.png\'); }');
                    return cssPreprocessor.preprocess('div { background: url("1.png"); }', '1.css');
                }).then(function(css) {
                    css.should.equal('div { background: url("1.css#1.png"); }');
                    return cssPreprocessor.preprocess('div { background: url(1.png); }', '1.css');
                })
                .then(function(css) {
                    css.should.equal('div { background: url(1.css#1.png); }');
                    next();
                }).fail(function(e) {
                    next(e);
                });
            });
            it('should not process remote image urls', function(next) {
                cssPreprocessor.setCssRelativeUrlBuilder(function(url, filename) {
                    return filename + '#' + url;
                });
                cssPreprocessor.preprocess(
                    'div { background: url(http://ya.ru/1.png); }', '1.css'
                ).then(function(css) {
                    css.should.equal('div { background: url(http://ya.ru/1.png); }');
                    return cssPreprocessor.preprocess('div { background: url(https://ya.ru/1.png); }', '1.css');
                }).then(function(css) {
                    css.should.equal('div { background: url(https://ya.ru/1.png); }');
                    return cssPreprocessor.preprocess('div { background: url(//ya.ru/1.png); }', '1.css');
                }).then(function(css) {
                    css.should.equal('div { background: url(//ya.ru/1.png); }');
                    return cssPreprocessor.preprocess('div { background: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC\'); }', '1.css');
                }).then(function(css) {
                    css.should.equal('div { background: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC\'); }');
                    next();
                }).fail(function(e) {
                    next(e);
                });
            });
        });
    });
});
