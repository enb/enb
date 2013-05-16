/**
 * BuildFlow
 * =========
 */

var inherit = require('inherit'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

/**
 * BuildFlow — это хэлпер для упрощения создания полностью настраиваемых технологий.
 *
 * Например, сборка js:
 * ```javascript
 *    module.exports = require('enb/lib/build-flow').create()
 *        .name('js')
 *        .target('target', '?.js')
 *        .useFileList('js')
 *        .justJoinFilesWithComments()
 *        .createTech();
 * ```
 * @name BuildFlow
 */
var BuildFlow = inherit( /** @lends BuildFlow.prototype */ {

    /**
     * Конструктор.
     */
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
        this._cacheValidator = function() {
            return false;
        };
        this._cacheSaver = function() {};
    },

    /**
     * Устанавливает имя технологии.
     * @param {String} techName
     * @returns {BuildFlow}
     */
    name: function(techName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._name = techName;
        });
    },

    /**
     * Определяет опцию для технологии.
     * @param {String} optionName Имя опции.
     * @param {*} [defaultValue] Значение по умолчанию.
     * @param {String} [fieldName] Имя поля, в которое необходимо записать значение опции (по умолчанию — "_<имя опции>").
     * @returns {BuildFlow}
     */
    defineOption: function(optionName, defaultValue, fieldName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._options[optionName] = {
                fieldName: fieldName || '_' + optionName,
                defaultValue: defaultValue
            };
        });
    },

    /**
     * Определяет обязательную опцию для технологии.
     * @param {String} optionName Имя опции.
     * @param {String} [fieldName] Имя поля, в которое необходимо записать значение опции (по умолчанию — "_<имя опции>").
     * @returns {BuildFlow}
     */
    defineRequiredOption: function(optionName, fieldName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._options[optionName] = {
                fieldName: fieldName || '_' + optionName
            };
            buildFlow._requiredOptions.push(optionName);
        });
    },

    /**
     * Требует список файлов по суффиксу или суффиксам.
     * Например, .useFileList("js") добавит в аргументы билдеру список файлов с расширением js.
     * @param {String|Array} suffixes
     * @returns {BuildFlow}
     */
    useFileList: function(suffixes) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(
                new BuildFlowLinkToFileList('filesTarget', '?.files', Array.isArray(suffixes) ? suffixes : [suffixes])
            );
        });
    },

    /**
     * Требует список директорий по суффиксу или суффиксам.
     * Например, .useDirList("i18n") добавит в аргументы билдеру список директорий с расширением i18n.
     * @param {String|Array} suffixes
     * @returns {BuildFlow}
     */
    useDirList: function(suffixes) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(
                new BuildFlowLinkToDirList('dirsTarget', '?.dirs', Array.isArray(suffixes) ? suffixes : [suffixes])
            );
        });
    },

    /**
     * Отменяет требование списка файлов.
     * @returns {BuildFlow}
     */
    unuseFileList: function() {
        return this._copyAnd(function(buildFlow) {
            buildFlow._removeUsage('filesTarget');
        });
    },

    /**
     * Отменяет требование списка директорий.
     * @returns {BuildFlow}
     */
    unuseDirList: function() {
        return this._copyAnd(function(buildFlow) {
            buildFlow._removeUsage('dirsTarget');
        });
    },

    /**
     * Требует имя файла другого таргета ноды, объявляет зависимость от этого таргета.
     * В аргументы билдера придет абсолютный путь к файлу.
     * @param {String} targetOptionName Имя опции для таргета.
     * @param {String} defaultTargetName Значение по умолчанию.
     * @returns {BuildFlow}
     */
    useSourceFilename: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetFilename(targetOptionName, defaultTargetName));
        });
    },

    /**
     * Требует список имен файлов других таргетов ноды, объявляет зависимость от этого таргета.
     * В аргументы билдера придет абсолютный путь к файлу.
     * @param {String} targetOptionName Имя опции для таргета.
     * @param {String[]} [defaultTargetNames] Значение по умолчанию.
     * @returns {BuildFlow}
     */
    useSourceListFilenames: function(targetOptionName, defaultTargetNames) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetList(targetOptionName, defaultTargetNames, BuildFlowLinkToTargetFilename));
        });
    },

    /**
     * Требует содержимое файла другого таргета ноды, объявляет зависимость от этого таргета.
     * В аргументы билдера придет содержимое файла.
     * @param {String} targetOptionName Имя опции для таргета.
     * @param {String} defaultTargetName Значение по умолчанию.
     * @returns {BuildFlow}
     */
    useSourceText: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetSource(targetOptionName, defaultTargetName));
        });
    },

    /**
     * Требует результат выполнения другого таргета ноды, объявляет зависимость от этого таргета.
     * В аргументы билдера придет результат выполнения технологии.
     * @param {String} targetOptionName
     * @param {String} defaultTargetName
     * @returns {BuildFlow}
     */
    useSourceResult: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetResult(targetOptionName, defaultTargetName));
        });
    },

    /**
     * Объявляет зависимость от таргета ноды, но не добявляет аргументов в билдер.
     * @param {String} targetOptionName
     * @param {String} defaultTargetName
     * @returns {BuildFlow}
     */
    dependOn: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._addDep(new BuildFlowLinkToTargetNoResult(targetOptionName, defaultTargetName));
        });
    },

    /**
     * Настраивает таргет для технологии.
     * @param {String} targetOptionName Имя опции, в котором передается таргет.
     * @param {String} defaultTargetName Имя таргета по умолчанию.
     * @returns {BuildFlow}
     */
    target: function(targetOptionName, defaultTargetName) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._targetOptionName = targetOptionName;
            buildFlow._defaultTargetName = defaultTargetName;
        });
    },

    /**
     * Определяет метод для сборки. Метод должен возвращать строку-результат сборки, либо промис,
     * который резолвится строкой.
     * Основной метод для технологии. Все источники, которые были определены через методы use* будут переданы в билдер,
     * как аргументы.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    builder: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._buildFunc = func;
        });
    },

    /**
     * Определяет метод проверки кэша при сборке.
     * Метод должен возвращает булевое значение.
     * true — необходимо пересобрать таргет.
     * false — нет необходимости пересобирать таргет.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    needRebuild: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._cacheValidator = func;
        });
    },

    /**
     * Сохраняет кэш для того, чтобы избежать лишнюю повторную сборку.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    saveCache: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._cacheSaver = func;
        });
    },

    /**
     * Определяет функцию-враппер.
     * В функцию передает строка, которую возвращает билдер.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    wrapper: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._wrapFunc = func;
        });
    },

    /**
     * Определяет функцию, сохраняющую результат выполнения билдера.
     * Фунция должна возвратить промис.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    saver: function(func) {
        return this._copyAnd(function(buildFlow) {
            buildFlow._saverFunc = func;
        });
    },

    /**
     * Определяет набор методов технологии.
     * @param {Object} methods Методы в виде хэш-таблицы (объекта).
     * @returns {BuildFlow}
     */
    methods: function(methods) {
        return this._copyAnd(function(buildFlow) {
            Object.keys(methods).forEach(function(methodName) {
                buildFlow._methods[methodName] = methods[methodName];
            });
        });
    },

    /**
     * Определяет набор статических методов технологии.
     * @param {Object} staticMethods Методы в виде хэш-таблицы (объекта).
     * @returns {BuildFlow}
     */
    staticMethods: function(staticMethods) {
        return this._copyAnd(function(buildFlow) {
            Object.keys(staticMethods).forEach(function(methodName) {
                buildFlow._staticMethods[methodName] = staticMethods[methodName];
            });
        });
    },

    /**
     * Создает копию инстанции BuildFlow.
     * @returns {BuildFlow}
     */
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
        result._cacheValidator = this._cacheValidator;
        result._cacheSaver = this._cacheSaver;
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

    /**
     * Хэлпер для построения билдера, который просто объединяет файлы, переданные в аргументах.
     * @param wrapper
     * @returns {BuildFlow}
     */
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

    /**
     * Хэлпер для построения билдера, который объединяет файлы, переданные в аргументах, расставляя комментарии
     * о расположении файлов.
     * @returns {BuildFlow}
     */
    justJoinFilesWithComments: function() {
        return this.justJoinFiles(function(filename, data) {
            var fn = filename.substr(1);
            return '/* begin: ' + fn + ' *' + '/\n' + data + '\n/* end: ' + fn + ' *' + '/';
        });
    },

    /**
     * Хэлпер для построения билдера, который объединяет текст, переданный в аргументах.
     * @returns {BuildFlow}
     */
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
    /**
     * Создает копию BuildFlow и выполняет переданную функцию для копии.
     * Возвращает копию.
     * @param {Function} func
     * @returns {BuildFlow}
     * @private
     */
    _copyAnd: function(func) {
        var result = this.copy();
        func(result);
        return result;
    },

    /**
     * Создает технологию.
     * @returns {Tech}
     */
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
            cacheValidator = this._cacheValidator,
            cacheSaver = this._cacheSaver,
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
                this._buildResult = undefined;
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
                if (cacheValidator.call(this, cache)) {
                    return true;
                }
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
                cacheSaver.call(this, cache);
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
                    return '/* begin: ' + fn + ' *' + '/\n' + data + '\n/* end: ' + fn + ' *' + '/';
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
                                    node.resolveTarget(_this._target, _this._buildResult);
                                });
                            });
                        });
                    } else {
                        node.getLogger().isValid(_this._target);
                        node.resolveTarget(_this._target, _this._buildResult);
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

exports.create = function() {
    return new BuildFlow();
};

