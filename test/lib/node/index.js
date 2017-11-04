'use strict';

const nodeFactory = require('../../../lib/node');
const Node = require('../../../lib/node/node');
const NodeWithGraph = require('../../../lib/node/node-with-graph');

describe('node/mk', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    it('should create simple Node if no graph passed', () => {
        sandbox.stub(Node.prototype);
        nodeFactory.mkNode('nodePath', 'makePlatform', 'cache');
        expect(Node.prototype.__constructor).to.be.called;
    });

    it('should create simple Node if no graph passed', () => {
        sandbox.stub(NodeWithGraph.prototype);
        nodeFactory.mkNode('nodePath', 'makePlatform', 'cache', 'graph');
        expect(NodeWithGraph.prototype.__constructor).to.be.called;
    });
});
