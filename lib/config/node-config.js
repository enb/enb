var TargetList = require('./target-list'),
    TechList = require('./tech-list'),
    path = require('path'),
    inherit = require('inherit');

module.exports = inherit(require('./configurable'), {
    __constructor: function(nodePath, root, projectConfig) {
        this.__base();
        this._baseName = path.basename(nodePath);
        this._path = nodePath;
        this._root = root;
        this._targets = [];
        this._cleanTargets = [];
        this._techs = [];
        this._languages = null;
        this._projectConfig = projectConfig;
    },
    setLanguages: function(languages) {
        this._languages = languages;
    },
    getLanguages: function() {
        return this._languages;
    },
    getNodePath: function() {
        return this._root + '/' + this._path;
    },
    resolvePath: function(path) {
        return this._root + '/' + this._path + (path ? '/' + path : '');
    },
    _processTarget: function(target) {
        var targetSources = {
            'lang': this._languages || this._projectConfig.getLanguages()
        };
        var targets = [];
        target = target.replace(/^\/+|\/+$/g, '').replace(/\?/g, this._baseName);
        if (/{\w+}/.test(target)) {
            var targetsToProcess = [target];
            while (targetsToProcess.length) {
                var newTargetsToProcess = [];
                targetsToProcess.forEach(function(target) {
                    var match = target.match(/{(\w+)}/);
                    if (match) {
                        var
                            varName = match[1],
                            values = targetSources[varName] || [];
                        var regex = new RegExp('{' + varName + '}', 'g');
                        if (values.length) {
                            values.forEach(function(value) {
                                newTargetsToProcess.push(target.replace(regex, value));
                            });
                        } else {
                            newTargetsToProcess.push(target.replace(regex, ''));
                        }
                    } else {
                        targets.push(target);
                    }
                });
                targetsToProcess = newTargetsToProcess;
            }
        } else {
            targets.push(target);
        }
        return targets;
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
            this._targets = this._targets.concat(this._processTarget(target));
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
            this._cleanTargets = this._cleanTargets.concat(this._processTarget(target));
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
