var fs = require('fs'),
    NodeConfig = require('./node-config'),
    NodeMaskConfig = require('./node-mask-config'),
    TargetList = require('./target-list'),
    TechList = require('./tech-list'),
    TaskConfig = require('./task-config'),
    ModeConfig = require('./mode-config'),
    inherit = require('inherit');

module.exports = inherit({
    __constructor: function(rootPath) {
        this._rootPath = rootPath;
        this._nodeConfigs = {};
        this._tasks = {};
        this._nodeMaskConfigs = [];
        this._languages = null;
        this._env = {};
        this._modes = {};
    },
    getLanguages: function() {
        return this._languages;
    },
    setLanguages: function(languages) {
        this._languages = languages;
    },
    getRootPath: function() {
        return this._rootPath;
    },
    resolvePath: function(path) {
        if (path) {
            if (typeof path == 'string') {
                return this._rootPath + '/' + path;
            } else {
                path.path = this._rootPath + '/' + path.path;
                return path;
            }
        } else {
            return this._rootPath;
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
        path = path.replace(/^\/+|\/+$/g, '');
        if (!this._nodeConfigs[path]) {
            this._nodeConfigs[path] = new NodeConfig(path, this._rootPath, this);
        }
        func && this._nodeConfigs[path].addChain(func);
        return this;
    },
    nodeMask: function(mask, func) {
        var nodeMask = new NodeMaskConfig(mask);
        nodeMask.addChain(func);
        this._nodeMaskConfigs.push(nodeMask);
        return this;
    },
    task: function(name, func) {
        if (!this._tasks[name]) {
            this._tasks[name] = new TaskConfig(name);
        }
        this._tasks[name].addChain(func);
        return this;
    },
    mode: function(name, func) {
        if (!this._modes[name]) {
            this._modes[name] = new ModeConfig(name);
        }
        this._modes[name].addChain(func);
        return this;
    },
    getTaskConfigs: function() {
        return this._tasks;
    },
    getTaskConfig: function(taskName) {
        return this._tasks[taskName];
    },
    getModeConfigs: function() {
        return this._modes;
    },
    getModeConfig: function(modeName) {
        return this._modes[modeName];
    },
    getNodeConfigs: function() {
        return this._nodeConfigs;
    },
    getNodeConfig: function(nodeName) {
        return this._nodeConfigs[nodeName];
    },
    getNodeMaskConfigs: function(nodePath) {
        var res = nodePath ? this._nodeMaskConfigs.filter(function(nodeMask) {
            return nodeMask.getMask().test(nodePath);
        }) : this._nodeMaskConfigs;
        return res;
    },
    getEnv: function(key) {
        return this._env[key];
    },
    setEnv: function(key, value) {
        var _this = this;
        if (typeof key === 'object') {
            Object.keys(key).forEach(function(name) {
                _this._env[name] = key[name];
            });
        } else {
            _this._env[key] = value;
        }
    },
    getEnvValues: function() {
        return this._env;
    }
});
