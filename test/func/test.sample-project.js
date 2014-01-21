var fs = require('fs');
require('chai').should();

describe('functional', function () {
    describe('sample-project', function () {
        describe('page', function () {
            var sourcePagePath = 'test/fixtures/sample-project/page';
            var destPagePath = 'test/fixtures/sample-project-result/page';
            fs.readdirSync(destPagePath).forEach(function (filename) {
                var sourceFilename = sourcePagePath + '/' + filename;
                var destFilename = destPagePath + '/' + filename;
                it('file page/' + filename + ' should equal', function () {
                    fs.readFileSync(sourceFilename, 'utf8').should.equal(
                        fs.readFileSync(destFilename, 'utf8')
                    );
                });
            });
        });
    });
});
