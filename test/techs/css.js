require('chai').should();
var mock = require('mock-fs');
var TestNode = require('../../lib/test/mocks/test-node');
var CssTech = require('../../techs/css');
var FileList = require('../../lib/file-list');
var sep = require('path').sep;

describe('techs', function () {
    describe('css', function () {
        var node;
        var fileList;

        beforeEach(function () {
            mock({
                'blocks': {
                    'A.ie.css': 'A { color: red; }',
                    'B.css': 'B { background: url(B.png); }',
                    'C.css': '@import "D.inc.css";',
                    'D.inc.css': 'D { color: blue; }'
                },
                build: {}
            });

            node = new TestNode('build');
            fileList = new FileList();
            fileList.loadFromDirSync('blocks');
            node.provideTechData('?.files', fileList);
        });

        afterEach(function () {
            mock.restore();
        });

        it('should build single CSS file using suffix list', function (done) {
            node.runTechAndGetContent(
                CssTech, {sourceSuffixes: ['ie.css', 'css', 'inc.css']}
            ).spread(function (source) {
                source.toString('utf-8').should.equal([
                    '/* ..' + sep + 'blocks' + sep + 'A.ie.css: begin */ /**/',
                    '    A { color: red; }',
                    '/* ..' + sep + 'blocks' + sep + 'A.ie.css: end */ /**/',
                    '',
                    '/* ..' + sep + 'blocks' + sep + 'B.css: begin */ /**/',
                    '    B { background: url(..' + sep + 'blocks' + sep + 'B.png); }',
                    '/* ..' + sep + 'blocks' + sep + 'B.css: end */ /**/',
                    '',
                    '/* ..' + sep + 'blocks' + sep + 'C.css: begin */ /**/',
                    '    /* D.inc.css: begin */ /**/',
                    '        D { color: blue; }',
                    '    /* D.inc.css: end */ /**/',
                    '    ',
                    '/* ..' + sep + 'blocks' + sep + 'C.css: end */ /**/',
                    '',
                    '/* ..' + sep + 'blocks' + sep + 'D.inc.css: begin */ /**/',
                    '    D { color: blue; }',
                    '/* ..' + sep + 'blocks' + sep + 'D.inc.css: end */ /**/',
                    ''
                ].join('\n'));
            }).then(done, done);
        });
        it('should build single CSS file using default suffix', function (done) {
            node.runTechAndGetContent(CssTech).then(function (source) {
                source.toString('utf-8').should.equal([
                    '/* ..' + sep + 'blocks' + sep + 'B.css: begin */ /**/',
                    '    B { background: url(..' + sep + 'blocks' + sep + 'B.png); }',
                    '/* ..' + sep + 'blocks' + sep + 'B.css: end */ /**/',
                    '',
                    '/* ..' + sep + 'blocks' + sep + 'C.css: begin */ /**/',
                    '    /* D.inc.css: begin */ /**/',
                    '        D { color: blue; }',
                    '    /* D.inc.css: end */ /**/',
                    '    ',
                    '/* ..' + sep + 'blocks' + sep + 'C.css: end */ /**/',
                    ''
                ].join('\n'));
            }).then(done, done);
        });
    });
});
