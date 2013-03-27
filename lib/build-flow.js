var inherit = require('inherit'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

exports.create = function() {
    return new BuildFlow();
};

var BuildFlow = inherit({
    __constructor: function() {
        this._name = '';
        this._usages = [];
        this._dependencies = [];
        this._targetOptionName = '';
        this._defaultTargetName = '';
        this._requiredOptions = [];
        this._options = {};
        this._methods = {};
        this._staticMethods = {};
        this._buildFunc = function() {
            throw new Error('You should declare build function using "build" method of BuildFlow.');
        };
        this._wrapFunc = function(data) {
            return data;
        };
        this._saveFunc = function(filename, result) {
            return vowFs.write(filename, result, 'utf8');
        };
    },
    name: function(techName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._name = techName;
        });
    },
    defineOption: function(optionName, defaultValue, fieldName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._options[optionName] = {
                fieldName: fieldName || '_' + optionName,
                defaultValue: defaultValue
            };
        });
    },
    defineRequiredOption: function(optionName, fieldName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._options[optionName] = {
                fieldName: fieldName || '_' + optionName
            };
            buildFlow._requiredOptions.push(optionName);
        });
    },
    useFileList: function(suffixes) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(
                new BuildFlowLinkToFileList('filesTarget', '?.files', Array.isArray(suffixes) ? suffixes : [suffixes])
            );
        });
    },
    useDirList: function(suffixes) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(
                new BuildFlowLinkToDirList('dirsTarget', '?.dirs', Array.isArray(suffixes) ? suffixes : [suffixes])
            );
        });
    },
    unuseFileList: function() {
        return this._copyAnd(function(buildFlow) {
            buildFlow._removeUsage('filesTarget');
        });
    },
    useSourceFilename: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetFilename(targetOptionName, defaultTargetName));
        });
    },
    useSourceListFilenames: function(targetOptionName, defaultTargetNames) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetList(targetOptionName, defaultTargetNames, BuildFlowLinkToTargetFilename));
        });
    },
    useSourceText: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetSource(targetOptionName, defaultTargetName));
        });
    },
    useSourceResult: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetResult(targetOptionName, defaultTargetName));
        });
    },
    dependOn: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addDep(new BuildFlowLinkToTargetNoResult(targetOptionName, defaultTargetName));
        });
    },
    target: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._targetOptionName = targetOptionName;
            buildFlow._defaultTargetName = defaultTargetName;
        });
    },
    builder: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._buildFunc = func;
        });
    },
    wrapper: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._wrapFunc = func;
        });
    },
    saver: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._saverFunc = func;
        });
    },
    methods: function(methods) {
        return this._copyAnd(function(buildFlow) {
            Object.keys(methods).forEach(function(methodName) {
                buildFlow._methods[methodName] = methods[methodName];
            });
        });
    },
    staticMethods: function(staticMethods) {
        return this._copyAnd(function(buildFlow) {
            Object.keys(staticMethods).forEach(function(methodName) {
                buildFlow._staticMethods[methodName] = staticMethods[methodName];
            });
        });
    },
    copy: function() {
        var result = new BuildFlow();
        result._targetOptionName = this._targetOptionName;
        result._defaultTargetName = this._defaultTargetName;
        result._name = this._name;
        result._usages = this._usages.slice(0);
        result._dependencies = this._dependencies.slice(0);
        result._requiredOptions = this._requiredOptions.slice(0);
        result._buildFunc = this._buildFunc;
        result._saveFunc = this._saveFunc;
        result._wrapFunc = this._wrapFunc;
        var options = this._options;
        Object.keys(options).forEach(function(optName) {
            result._options[optName] = options[optName];
        });
        var methods = this._methods;
        Object.keys(methods).forEach(function(methodName) {
            result._methods[methodName] = methods[methodName];
        });
        var staticMethods = this._staticMethods;
        Object.keys(staticMethods).forEach(function(methodName) {
            result._staticMethods[methodName] = staticMethods[methodName];
        });
        return result;
    },
    justJoinFiles: function(wrapper) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._buildFunc = function() {
                var _this = this;
                return Vow.all(Array.prototype.map.call(arguments, function(arg) {
                    if (typeof arg === 'string') {
                        return vowFs.read(arg, 'utf8').then(function(data) {
                            return wrapper ? wrapper(arg, data) : data;
                        });
                    } else if (Array.isArray(arg)) {
                        return _this._joinFiles(arg, wrapper);
                    } else {
                        return '';
                    }
                })).then(function(res) {
                    return res.join('\n');
                });
            };
        });
    },
    justJoinFilesWithComments: function() {
        return this.justJoinFiles(function(filename, data) {
            var fn = filename.substr(1);
            return '/* begin: ' + fn + ' */\n' + data + '\n/* end: ' + fn + ' */';
        });
    },
    justJoinSources: function() {
        return this._copyAnd(function(buildFlow) {
            buildFlow._buildFunc = function() {
                var _this = this;
                return Vow.all(Array.prototype.map.call(arguments, function(arg) {
                    if (typeof arg === 'string') {
                        return arg;
                    } else if (Array.isArray(arg)) {
                        return _this._joinFiles(arg);
                    } else {
                        return '';
                    }
                })).then(function(res) {
                    return res.join('\n');
                });
            };
        });
    },
    _addUsage: function(usage) {
        return this._addToTargetLinks(this._usages, usage);
    },
    _removeUsage: function(targetOptionName) {
        this._usages = this._usages.filter(function(link) {
            return link.getTargetOptionName() !== targetOptionName;
        });
    },
    _addDep: function(dep) {
        return this._addToTargetLinks(this._dependencies, dep);
    },
    _addToTargetLinks: function(links, link) {
        var optionName = link.getTargetOptionName();
        for (var i = 0, l = links.length; i < l; i++) {
            if (links[i].getTargetOptionName() == optionName) {
                links[i] = link;
                return this;
            }
        }
        links.push(link);
        return this;
    },
    _copyAnd: function(func) {
        var result = this.copy();
        func(result);
        return result;
    },
    createTech: function() {
        var name = this._name,
            targetOptionName = this._targetOptionName,
            defaultTargetName = this._defaultTargetName,
            usages = this._usages.concat(this._dependencies),
            requiredOptions = this._requiredOptions,
            options = this._options,
            buildFunc = this._buildFunc,
            saveFunc = this._saveFunc,
            wrapFunc = this._wrapFunc,
            methods = this._methods,
            staticMethods = this._staticMethods;
        if (!name) {
            throw new Error('You should declare tech name using "name" method of BuildFlow.');
        }
        if (!targetOptionName) {
            throw new Error('You should declare tech target name using "target" method of BuildFlow.');
        }
        var resultTechMethods = {
            configure: function() {
                var _this = this, node = this.node;
                this._optionFieldNames = {};
                Object.keys(options).forEach(function(optName) {
                    var option = options[optName];
                    _this[option.fieldName] = _this.getOption(optName, option.defaultValue);
                    _this._optionFieldNames[optName] = option.fieldName;
                });
                this._target = node.unmaskTargetName(
                    this._preprocessTargetName(_this.getOption(targetOptionName, defaultTargetName))
                );
                requiredOptions.forEach(function(requiredOption) {
                    _this.getRequiredOption(requiredOption);
                });
                usages.forEach(function(usage) {
                    usage.configureUsages(_this, node);
                });
            },
            getName: function() {
                return name;
            },
            getTargets: function() {
                return [this._target];
            },
            _requireSources: function() {
                var _this = this, node = this.node;
                return Vow.all(usages.map(function(usage) {
                    return usage.requireTarget(_this, node);
                }));
            },
            _isRebuildRequired: function() {
                var cache = this.node.getNodeCache(this._target);
                if (cache.needRebuildFile('target', this.node.resolvePath(this._target))) {
                    return true;
                }
                for (var i = 0, l = usages.length; i < l; i++) {
                    if (!usages[i].isCacheValid(this, this.node, cache)) {
                        return true;
                    }
                }
                return false;
            },
            _saveCache: function() {
                var cache = this.node.getNodeCache(this._target);
                cache.cacheFileInfo('target', this.node.resolvePath(this._target));
                for (var i = 0, l = usages.length; i < l; i++) {
                    usages[i].saveCache(this, this.node, cache);
                }
            },
            _getBuildResult: function() {
                return buildFunc.apply(this, arguments);
            },
            _saveBuildResult: function() {
                return saveFunc.apply(this, arguments);
            },
            _wrapBuildResult: function() {
                return wrapFunc.apply(this, arguments);
            },
            _joinFiles: function(files, wrapper) {
                return Vow.all(files.map(function(fileInfo) {
                    return vowFs.read(fileInfo.fullname, 'utf8').then(function(data) {
                        return wrapper ? wrapper(fileInfo.fullname, data) : data;
                    });
                })).then(function(results) {
                    return results.join('\n');
                });
            },
            _joinFilesWithComments: function(files) {
                return this._joinFiles(files, function(filename, data) {
                    var fn = filename.substr(1);
                    return '/* begin: ' + fn + ' */\n' + data + '\n/* end: ' + fn + ' */';
                });
            },
            _preprocessTargetName: function(targetName) {
                var _this = this;
                return targetName.replace(/{([^}]+)}/g, function(s, optName) {
                    return _this[_this._optionFieldNames[optName]] || '';
                });
            },
            build: function() {
                var _this = this, node = this.node;
                return this._requireSources().then(function(results) {
                    if (_this._isRebuildRequired()) {
                        return Vow.when(_this._getBuildResult.apply(_this, results)).then(function(data) {
                            return Vow.when(_this._wrapBuildResult(data)).then(function(wrappedData) {
                                return Vow.when(_this._saveBuildResult(_this.node.resolvePath(_this._target), wrappedData)).then(function() {
                                    _this._saveCache();
                                    node.resolveTarget(_this._target);
                                });
                            });
                        });
                    } else {
                        node.getLogger().isValid(_this._target);
                        node.resolveTarget(_this._target);
                        return null;
                    }
                });
            }
        };
        Object.keys(methods).forEach(function(methodName) {
            resultTechMethods[methodName] = methods[methodName];
        });
        var resultTech = inherit(require('./tech/base-tech'), resultTechMethods, staticMethods),
            currentBuildFlow = this;
        resultTech.buildFlow = function() {
            return currentBuildFlow;
        };
        return resultTech;
    }
});

var BuildFlowLinkToTargetResult = inherit({
    __constructor: function(targetOptionName, defaultTargetName) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetName = defaultTargetName;
        this._fieldName = '_' + targetOptionName;
    },
    getTargetOptionName: function() {
        return this._targetOptionName;
    },
    configureUsages: function(tech, node) {
        tech[this._fieldName] = node.unmaskTargetName(
            tech._preprocessTargetName(tech.getOption(this._targetOptionName, this._defaultTargetName))
        );
    },
    isCacheValid: function(tech, node, cache) {
        var targetName = tech[this._fieldName],
            targetPath = node.resolvePath(targetName);
        return !cache.needRebuildFile('target:' + targetName, targetPath);
    },
    saveCache: function(tech, node, cache) {
        var targetName = tech[this._fieldName],
            targetPath = node.resolvePath(targetName);
        cache.cacheFileInfo('target:' + targetName, targetPath);
    },
    requireTarget: function(tech, node) {
        var _this = this,
            processTargetResult = this._processTargetResult;
        return node.requireSources([tech[this._fieldName]]).spread(function(result) {
            return processTargetResult.call(_this, tech, node, result);
        });
    },
    getFieldName: function() {
        return this._fieldName;
    },
    _processTargetResult: function(tech, node, result) {
        return result;
    }
}),
BuildFlowLinkToTargetNoResult = inherit(BuildFlowLinkToTargetResult, {
    _processTargetResult: function(tech, node, result) {
        return '';
    }
}),
BuildFlowLinkToTargetFilename = inherit(BuildFlowLinkToTargetResult, {
    _processTargetResult: function(tech, node, result) {
        return node.resolvePath(tech[this._fieldName]);
    }
}),
BuildFlowLinkToTargetSource = inherit(BuildFlowLinkToTargetResult, {
    _processTargetResult: function(tech, node, result) {
        return vowFs.read(node.resolvePath(tech[this._fieldName]), 'utf8');
    }
}),
BuildFlowLinkToFileList = inherit(BuildFlowLinkToTargetResult, {
    __constructor: function(targetOptionName, defaultTargetName, suffixes) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetName = defaultTargetName;
        this._fieldName = '_' + targetOptionName;
        this._listName = '_list' + targetOptionName;
        this._suffixes = suffixes;
    },
    getTargetOptionName: function() {
        return this._targetOptionName;
    },
    isCacheValid: function(tech, node, cache) {
        var targetName = tech[this._fieldName];
        return !cache.needRebuildFileList('target:' + targetName, tech[this._listName]);
    },
    saveCache: function(tech, node, cache) {
        var targetName = tech[this._fieldName];
        return cache.cacheFileList('target:' + targetName, tech[this._listName]);
    },
    _processTargetResult: function(tech, node, result) {
        return tech[this._listName] = result.getBySuffix(this._suffixes);
    }
}),
BuildFlowLinkToDirList = inherit(BuildFlowLinkToTargetResult, {
    __constructor: function(targetOptionName, defaultTargetName, suffixes) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetName = defaultTargetName;
        this._fieldName = '_' + targetOptionName;
        this._listName = '_list' + targetOptionName;
        this._suffixes = suffixes;
    },
    getTargetOptionName: function() {
        return this._targetOptionName;
    },
    isCacheValid: function(tech, node, cache) {
        var targetName = tech[this._fieldName],
            files = [].concat.apply([], tech[this._listName].map(function(dir) {
                return dir.files;
            }));
        return !cache.needRebuildFileList('target:' + targetName, files);
    },
    saveCache: function(tech, node, cache) {
        var targetName = tech[this._fieldName],
            files = [].concat.apply([], tech[this._listName].map(function(dir) {
                return dir.files;
            }));
        return cache.cacheFileList('target:' + targetName, files);
    },
    _processTargetResult: function(tech, node, result) {
        return tech[this._listName] = result.getBySuffix(this._suffixes);
    }
}),

BuildFlowLinkToTargetList = inherit({
    __constructor: function(targetOptionName, defaultTargetNames, linkClass) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetNames = defaultTargetNames || [];
        this._linkClass = linkClass;
        this._fieldName = '_' + targetOptionName;
        this._usagesFieldName = '_usageList_' + targetOptionName;
    },
    getTargetOptionName: function() {
        return this._targetOptionName;
    },
    configureUsages: function(tech, node) {
        var _this = this, links = [], targetNames = [], targetOptionName = this._targetOptionName, i = 0;
        tech.getOption(this._targetOptionName, this._defaultTargetNames).forEach(function(targetName) {
            var link = new _this._linkClass(targetOptionName + '[' + i + ']', targetName);
            link.configureUsages(tech, node);
            targetNames.push(tech[link.getFieldName()]);
            links.push(link);
            i++;
        });
        tech[this._fieldName] = targetNames;
        tech[this._usagesFieldName] = links;
    },
    isCacheValid: function(tech, node, cache) {
        var links = tech[this._usagesFieldName];
        for (var i = 0, l = links.length; i < l; i++) {
            if (!links[i].isCacheValid(tech, node, cache)) {
                return false;
            }
        }
        return true;
    },
    saveCache: function(tech, node, cache) {
        tech[this._usagesFieldName].forEach(function(link) {
            link.saveCache(tech, node, cache);
        });
    },
    requireTarget: function(tech, node) {
        return Vow.all(tech[this._usagesFieldName].map(function(link) {
            return link.requireTarget(tech, node);
        }));
    }
});

