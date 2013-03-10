var TargetList = require('./target-list'),
    TechList = require('./tech-list'),
    path = require('path'),
    inherit = require('inherit');

module.exports = inherit(require('./configurable'), {
    __constructor: function(nodePath, root) {
        this.__base();
        this._baseName = path.basename(nodePath);
        this._path = nodePath;
        this._root = root;
        this._targets = [];
        this._cleanTargets = [];
        this._techs = [];
    },
    getNodePath: function() {
        return this._root + '/' + this._path;
    },
    resolvePath: function(path) {
        return this._root + '/' + this._path + (path ? '/' + path : '');
    },
    addTargets: function(targets) {
        var _this = this;
        if (targets instanceof TargetList) {
            this.addTargets(targets.getTargets());
        } else {
            targets.forEach(function(target) {
                _this.addTarget(target);
            });
        }
        return this;
    },
    addTarget: function(target) {
        if (target instanceof TargetList) {
            this.addTargets(target.getTargets())
        } else {
            this._targets.push(target.replace(/^\/+|\/+$/g, '').replace(/\?/g, this._baseName));
        }
        return this;
    },
    addCleanTargets: function(targets) {
        var _this = this;
        if (targets instanceof TargetList) {
            this.addCleanTargets(targets.getTargets());
        } else {
            targets.forEach(function(target) {
                _this.addCleanTarget(target);
            });
        }
        return this;
    },
    addCleanTarget: function(target) {
        if (target instanceof TargetList) {
            this.addCleanTargets(target.getTargets())
        } else {
            this._cleanTargets.push(target.replace(/^\/+|\/+$/g, '').replace(/\?/g, this._baseName));
        }
        return this;
    },
    addTechs: function(techs) {
        var _this = this;
        if (techs instanceof TechList) {
            this.addTechs(techs.getTechs());
        } else {
            techs.forEach(function(tech) {
                _this.addTech(tech);
            });
        }
        return this;
    },
    addTech: function(tech) {
        if (tech instanceof TechList) {
            this.addTechs(tech.getTechs())
        } else {
            this._techs.push(tech);
        }
        return this;
    },
    getTargets: function() {
        return this._targets;
    },
    getCleanTargets: function() {
        return this._cleanTargets;
    },
    getTechs: function() {
        return this._techs;
    },
    getPath: function() {
        return this._path;
    }    
});
