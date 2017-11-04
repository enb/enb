'use strict';

var Node = require('./node');
var NodeWithGraph = require('./node-with-graph');

exports.mkNode = function (nodePath, makePlatform, cache, graph) {
    return graph
        ? new NodeWithGraph(nodePath, makePlatform, cache, graph)
        : new Node(nodePath, makePlatform, cache);
};
