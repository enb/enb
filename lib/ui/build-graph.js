'use strict';

/**
 * BuildGraph
 * ==========
 *
 * Граф сборки. Строит граф зависимостей во время сборки.
 */
const path = require('path');

const inherit = require('inherit');

const colors = require('./colorize');

/**
 * @name BuildGraph
 */
module.exports = inherit({

    /**
     * Конструктор.
     * @param {String} caption заголовок для графа.
     */
    __constructor(caption) {
        this._caption = caption;
        this._targets = {};
    },

    /**
     * Добавляет узел в граф.
     * @param {String} targetPath путь к узлу
     * @param {String} tech имя технологии
     */
    addTarget(targetPath, tech) {
        const target = this._targets[targetPath] = this._targets[targetPath] || {};
        target.name = targetPath;
        target.tech = tech;
        target.deps = target.deps || [];
        target.resolved = target.resolved || false;
    },

    /**
     * Помечает узел, как успешно выполненный.
     * В графе выводятся лишь выполненные узлы,
     * чтобы не перегружать ненужной информацией.
     * @param {String} targetPath
     */
    resolveTarget(targetPath) {
        const target = this._targets[targetPath] = this._targets[targetPath] || {};
        target.resolved = true;
    },

    /**
     * @param {String} targetPath
     * @returns {Array}
     */
    getDirectDeps(targetPath) {
        const target = this._targets[targetPath] || {};
        return target.deps || [];
    },

    /**
     * Добавляет зависимость одного узла от другого.
     * @param {String} targetPath узел
     * @param {String} depFromPath зависимость узла
     */
    addDep(targetPath, depFromPath) {
        const target = this._targets[targetPath] = this._targets[targetPath] || {};
        target.deps = target.deps || [];
        if (target.deps.indexOf(depFromPath) === -1) {
            target.deps.push(depFromPath);
        }
    },

    /**
     * Формирует граф, пригодный для вывода в консоли.
     * @returns {String}
     */
    render() {
        let res = `\n   Build graph for ${colors.bold(this._caption)}:\n\n`;
        const targets = this._targets;
        const nonDepTargets = {};
        Object.keys(targets).forEach(key => {
            if (targets[key].resolved) {
                nonDepTargets[key] = true;
            }
        });
        Object.keys(targets).forEach(key => {
            targets[key].deps.forEach(depKey => {
                delete nonDepTargets[depKey];
            });
        });
        const _this = this;
        res += Object.keys(nonDepTargets).map(key => _this.renderTarget(key, false)).join('\n\n');
        return res;
    },

    renderPumlFragments() {
        const res = [];
        const packageData = {};
        const targets = this._targets;
        Object.keys(targets).forEach(key => {
            const target = targets[key];
            const packageName = path.dirname(target.name);
            const packageRes = (packageData[packageName] = packageData[packageName] || []);
            packageRes.push(
                `[<b>${path.basename(target.name)}</b>\\n${target.tech}] as [${target.name}]`
            );
            target.deps.forEach(depName => {
                packageRes.push(`[${target.name}] <-- [${depName}]`);
            });
        });
        Object.keys(packageData).forEach(packageName => {
            res.push(`folder [${packageName}] {\n${packageData[packageName].join('\n')}\n}`);
        });
        return res;
    },

    renderFragmentedPumlLinks() {
        const pumlLink = require('puml-link');
        return this.renderPumlFragments().map(fragment => pumlLink.generatePumlUrl(fragment));
    },

    /**
     * Формирует текст узла графа.
     * @param {String} targetName узел
     * @param {String} sub является ли узел дочерним
     * @returns {string}
     */
    renderTarget(targetName, sub) {
        const targets = this._targets;
        const target = targets[targetName];
        const _this = this;
        const subTargetsRendered = target.deps.map(dep => _this.renderTarget(dep, true));
        let targetInfo = (sub ? '- ' : '') + path.basename(target.name);
        let targetDir = (sub ? '  ' : '') + path.dirname(target.name);
        if (targetDir.length > targetInfo.length) {
            targetInfo += (new Array(targetDir.length - targetInfo.length + 1)).join(' ');
        }
        if (targetInfo.length > targetDir.length) {
            targetDir += (new Array(targetInfo.length - targetDir.length + 1)).join(' ');
        }
        if (subTargetsRendered.length > 0) {
            const larr = ' <-';
            const targetInfoLen = targetInfo.length + larr.length;
            targetInfo = targetInfo + colors.grey(larr);
            const subTargetsLines = subTargetsRendered.join('\n\n').split('\n');
            let doIndent = false;
            let indentStarted = false;
            for (let i = 0, l = subTargetsLines.length; i < l; i++) {
                let indentSym = subTargetsRendered.length === 1 ? ' ' : '|';
                const joinSym = subTargetsRendered.length === 1 ? '-' : '+';
                let line = subTargetsLines[i];
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
                        for (let j = i; j < l; j++) {
                            if (subTargetsLines[j].charAt(0) === '-') {
                                doIndent = true;
                            }
                        }
                    }
                }
                const indent = doIndent ? indentSym : ' ';
                if (i === Math.floor(l / 2) - 1) {
                    subTargetsLines[i] = targetInfo + colors.grey(joinSym) + line;
                } else if (i === Math.floor(l / 2)) {
                    subTargetsLines[i] = `${colors.grey(targetDir)}   ${colors.grey(indent)}${line}`;
                } else {
                    subTargetsLines[i] = new Array(targetInfoLen + 1).join(' ') + colors.grey(indent) + line;
                }
            }
            return subTargetsLines.join('\n');
        }

        return `${targetInfo}\n${colors.grey(targetDir)}`;
    }
});
