require('chai').should();
var mock = require('mock-fs');
var TestNode = require('../../lib/test/mocks/test-node');
var CssTech = require('../../techs/css');
var FileList = require('../../lib/file-list');

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
            ).spread(function (cssFile) {
                cssFile.toString('utf-8').should.equal([
                    '/* ../blocks/A.ie.css: begin */ /**/',
                    '    A { color: red; }',
                    '/* ../blocks/A.ie.css: end */ /**/',
                    '',
                    '/* ../blocks/B.css: begin */ /**/',
                    '    B { background: url(../blocks/B.png); }',
                    '/* ../blocks/B.css: end */ /**/',
                    '',
                    '/* ../blocks/C.css: begin */ /**/',
                    '    /* D.inc.css: begin */ /**/',
                    '        D { color: blue; }',
                    '    /* D.inc.css: end */ /**/',
                    '    ',
                    '/* ../blocks/C.css: end */ /**/',
                    '',
                    '/* ../blocks/D.inc.css: begin */ /**/',
                    '    D { color: blue; }',
                    '/* ../blocks/D.inc.css: end */ /**/',
                    ''
                ].join('\n'));
            }).then(done, done);
        });
        it('should build single CSS file using default suffix', function (done) {
            node.runTechAndGetContent(CssTech).spread(function (cssFile) {
                cssFile.toString('utf-8').should.equal([
                    '/* ../blocks/B.css: begin */ /**/',
                    '    B { background: url(../blocks/B.png); }',
                    '/* ../blocks/B.css: end */ /**/',
                    '',
                    '/* ../blocks/C.css: begin */ /**/',
                    '    /* D.inc.css: begin */ /**/',
                    '        D { color: blue; }',
                    '    /* D.inc.css: end */ /**/',
                    '    ',
                    '/* ../blocks/C.css: end */ /**/',
                    ''
                ].join('\n'));
            }).then(done, done);
        });
    });
});
