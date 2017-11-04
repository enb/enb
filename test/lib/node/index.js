'use strict';

var nodeFactory = require('../../../lib/node');
var Node = require('../../../lib/node/node');
var NodeWithGraph = require('../../../lib/node/node-with-graph');

describe('node/mk', function () {
    var sandbox = sinon.sandbox.create();

    afterEach(function () {
        sandbox.restore();
    });

    it('should create simple Node if no graph passed', function () {
        sandbox.stub(Node.prototype);
        nodeFactory.mkNode('nodePath', 'makePlatform', 'cache');
        expect(Node.prototype.__constructor).to.be.called;
    });

    it('should create simple Node if no graph passed', function () {
        sandbox.stub(NodeWithGraph.prototype);
        nodeFactory.mkNode('nodePath', 'makePlatform', 'cache', 'graph');
        expect(NodeWithGraph.prototype.__constructor).to.be.called;
    });
});
