'use strict';

/**
 * NodeWithGraph
 * =============
 */

const Node = require('./node');
const inherit = require('inherit');
const path = require('path');

module.exports = inherit(Node, {
    __constructor(nodePath, makePlatform, cache, graph) {
        this.__base(nodePath, makePlatform, cache);

        /**
         * Построитель графа сборки.
         * @type {BuildGraph}
         * @name NodeWithGraph.prototype._graph
         * @private
         */
        this._graph = graph;
    },

    _initTech(tech) {
        const _this = this;
        const NodeAdapter = function () {};
        NodeAdapter.prototype = _this;
        const nodeAdapter = new NodeAdapter();

        tech.init(nodeAdapter);

        const targets = tech.getTargets();
        targets.forEach(target => {
            const targetPath = path.join(_this._path, target);
            _this._graph.addTarget(targetPath, tech.getName());
        });

        nodeAdapter.requireSources = sources => _this.requireSources(sources, targets);
        nodeAdapter.requireNodeSources = sources => _this.requireNodeSources(sources, targets);
    },

    requireSources(sources, targets) {
        const _this = this;
        this._addDepsToGraph(targets, sources, source => path.join(_this._path, _this.unmaskTargetName(source)));

        return Node.prototype.requireSources.apply(this, arguments);
    },

    requireNodeSources(sources, targets) {
        Object.keys(sources).forEach(nodeName => {
            const nodeSources = sources[nodeName];

            this._addDepsToGraph(targets, nodeSources, (source) => {
                return path.join(nodeName, this.unmaskNodeTargetName(nodeName, source));
            });
        });

        return Node.prototype.requireNodeSources.apply(this, arguments);
    },

    _addDepsToGraph(targets, sources, getDepFromPath) {
        const _this = this;
        targets = targets || [];

        targets.forEach(target => {
            const targetPath = path.join(_this._path, target);
            sources.forEach(source => {
                _this._graph.addDep(
                    targetPath,
                    getDepFromPath(source)
                );
            });
        });
    },

    resolveTarget(target) {
        this._graph.resolveTarget(path.join(this._path, target));
        return Node.prototype.resolveTarget.apply(this, arguments);
    },

    destruct() {
        this.__base();
        delete this._graph;
    }
});
