/**
 * BuildGraph
 * ==========
 *
 * Граф сборки. Строит граф зависимостей во время сборки.
 */
var inherit = require('inherit'),
    colors = require('colors'),
    path = require('path');

module.exports = inherit({
    __constructor: function(caption) {
        this._caption = caption;
        this._targets = {};
    },

    addTarget: function(path, tech) {
        var target = this._targets[path] = this._targets[path] || {};
        target.name = path;
        target.tech = tech;
        target.deps = target.deps || [];
        target.resolved = target.resolved || false;
    },

    resolveTarget: function(path) {
        var target = this._targets[path] = this._targets[path] || {};
        target.resolved = true;
    },

    addDep: function(targetPath, depFromPath) {
        var target = this._targets[targetPath] = this._targets[targetPath] || {};
        target.deps = target.deps || [];
        !(~target.deps.indexOf(depFromPath)) && target.deps.push(depFromPath);
    },

    render: function() {
        var res = '\n   Build graph for ' + colors.bold(this._caption) + ':\n\n';
        var targets = this._targets;
        var nonDepTargets = {};
        Object.keys(targets).forEach(function(key) {
            if (targets[key].resolved) {
                nonDepTargets[key] = true;
            }
        });
        Object.keys(targets).forEach(function(key) {
            targets[key].deps.forEach(function(depKey) {
                delete nonDepTargets[depKey];
            });
        });
        var _this = this;
        res += Object.keys(nonDepTargets).map(function(key) {
            return _this.renderTarget(key, false);
        }).join('\n\n');
        return res;
    },

    renderTarget: function(targetName, sub) {
        var targets = this._targets;
        var target = targets[targetName];
        var _this = this;
        var subTargetsRendered = target.deps.map(function(dep) {
            return _this.renderTarget(dep, true);
        });
        var targetInfo = (sub ? '- ' : '') + path.basename(target.name);
        var targetDir = (sub ? '  ' : '') + path.dirname(target.name);
        if (targetDir.length > targetInfo.length) {
            targetInfo += (new Array(targetDir.length - targetInfo.length + 1)).join(' ');
        }
        if (targetInfo.length > targetDir.length) {
            targetDir += (new Array(targetInfo.length - targetDir.length + 1)).join(' ');
        }
        if (subTargetsRendered.length > 0) {
            var larr = ' <-';
            var targetInfoLen = targetInfo.length + larr.length;
            targetInfo = targetInfo + colors.grey(larr);
            var subTargetsLines = subTargetsRendered.join('\n\n').split('\n');
            var doIndent = false;
            var indentStarted = false;
            for (var i = 0, l = subTargetsLines.length; i < l; i++) {
                var indentSym = subTargetsRendered.length === 1 ? ' ' : '|';
                var joinSym = subTargetsRendered.length === 1 ? '-' : '+';
                var line = subTargetsLines[i];
                if (line.charAt(0) === '-') {
                    indentSym = '+';
                    line = colors.grey('-') + line.substr(1);
                    if (!doIndent) {
                        doIndent = true;
                        indentStarted = true;
                    }
                } else {
                    if (indentStarted) {
                        doIndent = false;
                        for (var j = i; j < l; j++) {
                            if (subTargetsLines[j].charAt(0) === '-') {
                                doIndent = true;
                            }
                        }
                    }
                }
                var indent = doIndent ? indentSym : ' ';
                if (i === Math.floor(l / 2) - 1) {
                    subTargetsLines[i] = targetInfo + colors.grey(joinSym) + line;
                } else if (i === Math.floor(l / 2)) {
                    subTargetsLines[i] = colors.grey(targetDir) + '   ' + colors.grey(indent) + line;
                } else {
                    subTargetsLines[i] = new Array(targetInfoLen + 1).join(' ') + colors.grey(indent) + line;
                }
            }
            return subTargetsLines.join('\n');
        }

        return targetInfo + '\n' + colors.grey(targetDir);
    }
});
