require('chai').should();
var FileSystem = require('../../lib/test/mocks/test-file-system');
var TestNode = require('../../lib/test/mocks/test-node');
var asyncFs = require('../../lib/fs/async-fs');
var fs = require('fs');
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
                    {file: 'A.css', content: 'A { color: red; }'},
                    {file: 'B.css', content: 'B { background: url(B.png); }'},
                    {file: 'C.css', content: '@import "D.css";'},
                    {file: 'D.css', content: 'D { color: blue; }'}
                ]
            }, {
                directory: 'build',
                items: []
            }]);
            fileSystem.setup(fs, asyncFs);
            node = new TestNode('build');
            fileList = new FileList();
            fileList.loadFromDirSync('blocks');
            node.provideTechData('?.files', fileList);
        });
        afterEach(function () {
            fileSystem.teardown(fs, asyncFs);
        });
        it('should build single CSS file using CSS file list', function (done) {
            node.runTechAndGetContent(CssTech).spread(function (cssFile) {
                cssFile.should.equal([
                    '/* ../blocks/A.css: begin */ /**/',
                    '    A { color: red; }',
                    '/* ../blocks/A.css: end */ /**/',
                    '',
                    '/* ../blocks/B.css: begin */ /**/',
                    '    B { background: url(../blocks/B.png); }',
                    '/* ../blocks/B.css: end */ /**/',
                    '',
                    '/* ../blocks/C.css: begin */ /**/',
                    '    /* D.css: begin */ /**/',
                    '        D { color: blue; }',
                    '    /* D.css: end */ /**/',
                    '    ',
                    '/* ../blocks/C.css: end */ /**/',
                    '',
                    '/* ../blocks/D.css: begin */ /**/',
                    '    D { color: blue; }',
                    '/* ../blocks/D.css: end */ /**/',
                    ''
                ].join('\n'));
            }).then(done, done);
        });
    });
});
