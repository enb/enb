var fs = require('fs'),
    NodeConfig = require('./node-config'),
    TargetList = require('./target-list'),
    TechList = require('./tech-list'),
    Task = require('../task/task');

function ProjectConfig(rootPath) {
    this._rootPath = rootPath;
    this._nodeConfigs = {};
    this._tasks = {};
}

ProjectConfig.prototype = {
    getRootPath: function() {
        return this._rootPath;
    },
    resolvePath: function(path) {
        if (typeof path == 'string') {
            return this._rootPath + '/' + path;
        } else {
            path.path = this._rootPath + '/' + path.path;
            return path;
        }
    },
    listDir: function(path) {
        return fs.readdirSync(path);
    },
    targetList: function(targets) {
        return new TargetList(targets);
    },
    techList: function(func) {
        return new TechList(func);
    },
    node: function(path, func) {
        if (!this._nodeConfigs[path]) {
            this._nodeConfigs[path] = new NodeConfig(path, this._rootPath);
        }
        func && func(this._nodeConfigs[path]);
        return this;
    },
    task: function(name, func) {
        if (!this._tasks[name]) {
            this._tasks[name] = new Task(name);
        }
        this._tasks[name].addChain(func);
        return this;
    },
    getNodeConfigs: function() {
        return this._nodeConfigs;
    },
    getNodeConfig: function(nodeName) {
        return this._nodeConfigs[nodeName];
    }
};

module.exports = ProjectConfig;