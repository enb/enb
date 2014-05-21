require('chai').should();
var FileSystem = require('../../lib/test/mocks/test-file-system');
var TestNode = require('../../lib/test/mocks/test-node');
var CssTech = require('../../techs/css');
var FileList = require('../../lib/file-list');

describe('techs', function () {
    describe('css', function () {
        var fileSystem;
        var node;
        var fileList;

        beforeEach(function () {
            fileSystem = new FileSystem([{
                directory: 'blocks',
                items: [
                    {file: 'A.ie.css', content: 'A { color: red; }'},
                    {file: 'B.css', content: 'B { background: url(B.png); }'},
                    {file: 'C.css', content: '@import "D.inc.css";'},
                    {file: 'D.inc.css', content: 'D { color: blue; }'}
                ]
            }, {
                directory: 'build',
                items: []
            }]);
            fileSystem.setup();
            node = new TestNode('build');
            fileList = new FileList();
            fileList.loadFromDirSync('blocks');
            node.provideTechData('?.files', fileList);
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('should build single CSS file using suffix list', function (done) {
            node.runTechAndGetContent(
                CssTech, {sourceSuffixes: ['ie.css', 'css', 'inc.css']}
            ).spread(function (cssFile) {
                cssFile.should.equal([
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
                cssFile.should.equal([
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
