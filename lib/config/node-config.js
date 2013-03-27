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
        targets.forEach(function(target) {
            _this.addTarget(target);
        });
        return this;
    },
    addTarget: function(target) {
        this._targets = this._targets.concat(this._processTarget(target));
        return this;
    },
    addCleanTargets: function(targets) {
        var _this = this;
        targets.forEach(function(target) {
            _this.addCleanTarget(target);
        });
        return this;
    },
    addCleanTarget: function(target) {
        this._cleanTargets = this._cleanTargets.concat(this._processTarget(target));
        return this;
    },
    addTechs: function(techs) {
        var _this = this;
        techs.forEach(function(tech) {
            _this.addTech(tech);
        });
        return this;
    },
    _processTechOptions: function(options) {
        var processLangs = false, optVal, i, p;
        for (i in options) {
            if (options.hasOwnProperty(i) && typeof (optVal = options[i]) === 'string' && optVal.indexOf('{lang}') !== -1) {
                processLangs = true;
                break;
            }
        }
        if (processLangs) {
            var result = [], langs = this._languages || this._projectConfig.getLanguages();
            for (var j = 0, l = langs.length; j < l; j++) {
                var optionsForLang = {};
                for (i in options) {
                    if (options.hasOwnProperty(i)) {
                        if (typeof (optVal = options[i]) === 'string' && (p = optVal.indexOf('{lang}')) !== -1) {
                            optionsForLang[i] = optVal.substr(0, p) + langs[j] + optVal.substr(p + 6);
                        } else {
                            optionsForLang[i] = optVal;
                        }
                    }
                }
                result.push(optionsForLang);
            }
            return result;
        } else {
            return [options];
        }
    },
    addTech: function(tech) {
        if (Array.isArray(tech)) {
            var techClass = tech[0],
                techOptions = tech[1] || {},
                techOptionList = this._processTechOptions(techOptions);
            for (var i = 0, l = techOptionList.length; i < l; i++) {
                this._techs.push(new techClass(techOptionList[i]));
            }
        } else if (typeof tech == 'function') {
            this._techs.push(new tech());
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
