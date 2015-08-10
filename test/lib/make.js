var chai = require('chai');
var expect = chai.expect;
var MakePlatform = require('../../lib/make');
var SharedResources = require('../../lib/shared-resources');

describe('make-platform', function () {
    var makePlatform;

    beforeEach(function () {
        makePlatform = new MakePlatform();
    });

    describe('constructor', function () {
        it('should create container for nodes', function () {
            expect(makePlatform._nodes).to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for node initialization promises', function () {
            expect(makePlatform._nodeInitPromises).to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should define property for cache storage', function () {
            expect(makePlatform).to.have.property('_cacheStorage');
        });

        it('should not create cache storage', function () {
            expect(makePlatform._cacheStorage).to.be.null;
        });

        it('should define property for project config', function () {
            expect(makePlatform).to.have.property('_projectConfig');
        });

        it('should not load project config', function () {
            expect(makePlatform._projectConfig).to.be.null;
        });

        it('should define property for project dir path', function () {
            expect(makePlatform).to.have.property('_cdir');
        });

        it('should not set project dir path', function () {
            expect(makePlatform._cdir).to.be.null;
        });

        it('should define property for languages container', function () {
            expect(makePlatform).to.have.property('_languages');
        });

        it('should not create container for languages', function () {
            expect(makePlatform._languages).to.be.null;
        });

        it('should create container for environment variables', function () {
            expect(makePlatform.getEnv()).to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should define property for build mode', function () {
            expect(makePlatform).to.have.property('_mode');
        });

        it('should not set build mode', function () {
            expect(makePlatform._mode).to.be.null;
        });

        it('should create container for makefiles', function () {
            expect(makePlatform._makefiles).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should define property for build graph', function () {
            expect(makePlatform).to.have.property('_graph');
        });

        it('shoud not instantiate build graph', function () {
            expect(makePlatform.getBuildGraph()).to.be.null;
        });

        it('should create container for level naming schemes', function () {
            expect(makePlatform._levelNamingSchemes).to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for shared resources', function () {
            expect(makePlatform.getSharedResources()).to.be.instanceOf(SharedResources);
        });
    });

    describe('init', function () {

    });
});
