/**
 * NodeWithGraph
 * =============
 */

var Node = require('./node');
var inherit = require('inherit');
var path = require('path');
var _ = require('lodash');

module.exports = inherit(Node, {
    __constructor: function (nodePath, makePlatform, cache, graph) {
        this.__base(nodePath, makePlatform, cache);

        /**
         * Построитель графа сборки.
         * @type {BuildGraph}
         * @name NodeWithGraph.prototype._graph
         * @private
         */
        this._graph = graph;
    },

    _initTech: function (tech) {
        var _this = this;
        var NodeAdapter = function () {};
        NodeAdapter.prototype = _this;
        var nodeAdapter = new NodeAdapter();

        tech.init(nodeAdapter);

        var targets = tech.getTargets();
        targets.forEach(function (target) {
            var targetPath = path.join(_this._path, target);
            _this._graph.addTarget(targetPath, tech.getName());
        });

        nodeAdapter.requireSources = function (sources) {
            return _this.requireSources(sources, targets);
        };
        nodeAdapter.requireNodeSources = function (sources) {
            return _this.requireNodeSources(sources, targets);
        };
    },

    requireSources: function (sources, targets) {
        var _this = this;
        this._addDepsToGraph(targets, sources, function (source) {
            return path.join(_this._path, _this.unmaskTargetName(source));
        });

        return Node.prototype.requireSources.apply(this, arguments);
    },

    requireNodeSources: function (sources, targets) {
        var _this = this;
        _.forEach(sources, function (nodeSources, nodeName) {
            _this._addDepsToGraph(targets, nodeSources, function (source) {
                return path.join(nodeName, _this.unmaskNodeTargetName(nodeName, source));
            });
        });

        return Node.prototype.requireNodeSources.apply(this, arguments);
    },

    _addDepsToGraph: function (targets, sources, getDepFromPath) {
        var _this = this;
        targets = targets || [];

        targets.forEach(function (target) {
            var targetPath = path.join(_this._path, target);
            sources.forEach(function (source) {
                _this._graph.addDep(
                    targetPath,
                    getDepFromPath(source)
                );
            });
        });
    },

    resolveTarget: function (target) {
        this._graph.resolveTarget(path.join(this._path, target));
        return Node.prototype.resolveTarget.apply(this, arguments);
    },

    destruct: function () {
        this.__base();
        delete this._graph;
    }
});
