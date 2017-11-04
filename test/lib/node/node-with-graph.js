'use strict';

const path = require('path');
const vow = require('vow');
const Node = require('../../../lib/node/node');
const NodeWithGraph = require('../../../lib/node/node-with-graph');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const Logger = require('../../../lib/logger');
const BaseTech = require('../../../lib/tech/base-tech');
const BuildGraph = require('../../../lib/ui/build-graph');

describe('node-with-graph', function () {
    const sandbox = sinon.sandbox.create();
    const nodePath = path.join('path', 'to', 'node');
    let node;
    let graph;

    beforeEach(function () {
        const projectDir = path.join('path', 'to', 'project');

        const makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        const cache = sinon.createStubInstance(Cache);
        cache.subCache.returns(sinon.createStubInstance(Cache));

        graph = sinon.createStubInstance(BuildGraph);
        node = new NodeWithGraph(nodePath, makePlatform, cache, graph);
        node.setLogger(sinon.createStubInstance(Logger));
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('resolveTarget', function () {
        it('should add resolved target to build graph', function () {
            sandbox.stub(Node.prototype, 'resolveTarget');

            node.resolveTarget('node.js');

            expect(graph.resolveTarget).to.be.calledWith(path.join(node.getPath(), 'node.js'));
            expect(Node.prototype.resolveTarget).to.be.calledWith('node.js');
        });
    });

    describe('loadTechs', function () {
        it('should add targets to build graph', function () {
            const tech = sinon.createStubInstance(BaseTech);
            tech.getTargets.returns(['node.js']);
            tech.getName.returns('tech');
            node.setTechs([tech]);

            node.loadTechs();

            expect(graph.addTarget).to.be.calledWith(
                path.join(nodePath, 'node.js'),
                'tech'
            );
        });
    });

    describe('requireSources', function () {
        it('should add dependency to build graph', function () {
            sandbox.stub(Node.prototype, 'requireSources');
            Node.prototype.requireSources.returns(vow.resolve());

            node.setTargetsToBuild(['node.js']);

            return node.requireSources(['?.js'], ['target.js'])
                .then(function () {
                    expect(graph.addDep).to.be.calledWith(
                        path.join(nodePath, 'target.js'),
                        path.join(nodePath, 'node.js')
                    );
                    expect(Node.prototype.requireSources).to.be.calledWith(['?.js']);
                });
        });
    });

    describe('requireNodeSources', function () {
        it('should add dependencies to build graph', function () {
            sandbox.stub(Node.prototype, 'requireNodeSources');
            Node.prototype.requireNodeSources.returns(vow.resolve());

            return node.requireNodeSources({ node: ['?.js'] }, ['target.js'])
                .then(function () {
                    expect(graph.addDep).to.be.calledWith(
                        path.join(nodePath, 'target.js'),
                        path.join('node', 'node.js')
                    );
                    expect(Node.prototype.requireNodeSources).to.be.calledWith({ node: ['?.js'] }, ['target.js']);
                });
        });
    });
});
