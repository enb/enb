var path = require('path');
var vow = require('vow');
var Node = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var BaseTech = require('../../../lib/tech/base-tech');

describe('node/cleanup', function () {
    var node;
    var tech;

    beforeEach(function () {
        var nodePath = path.join('path', 'to', 'node');
        var projectDir = path.join('path', 'to', 'project');

        var makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        tech = sinon.createStubInstance(BaseTech);
        tech.clean.returns(vow.fulfill);
        tech.getTargets.returns(['node.js']);

        node = new Node(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setTargetsToBuild(['node.js']);
        node.setTechs([tech]);
    });

    describe('cleanTargets', function () {
        beforeEach(function (done) {
            //no public method for registering targets available, clean does registering targets inside
            node.clean().then(function () {
                done();
            });
        });

        it('should return promise', function () {
            var result = node.cleanTargets(['node.js']);

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should throw error if no tech registered for passed target', function () {
            expect(function () { node.cleanTargets(['node.css']); })
                .to.throw('There is no tech for target node.css');
        });

        it('should call clean for techs associated with target', function () {
            tech.clean.reset(); //reset because clean is being called in constructor

            return node.cleanTargets(['node.js']).then(function  () {
                expect(tech.clean).to.be.calledOnce;
            });
        });
    });

    describe('clean', function () {
        it('should return promise', function () {
            var result = node.clean(['node.js']);

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should register node targets before initiating clean', function () {
            return node.clean(['node.js']).then(function () {
                expect(node.hasRegisteredTarget('node.js')).to.be.true;
            });
        });

        it('should initiate clean for resolved targets', function () {
            var cleanTargets = sinon.spy(node, 'cleanTargets');

            return node.clean(['node.js']).then(function () {
                expect(cleanTargets).to.be.called;
            });
        });
    });
});
