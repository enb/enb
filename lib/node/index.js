'use strict';

const Node = require('./node');
const NodeWithGraph = require('./node-with-graph');

exports.mkNode = (nodePath, makePlatform, cache, graph) => graph
    ? new NodeWithGraph(nodePath, makePlatform, cache, graph)
    : new Node(nodePath, makePlatform, cache);
