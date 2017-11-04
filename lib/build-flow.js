'use strict';

/**
 * BuildFlow
 * =========
 */

const inherit = require('inherit');
const Vow = require('vow');
const vowFs = require('./fs/async-fs');
const BaseTech = require('./tech/base-tech');
const EOL = require('os').EOL;

/**
 * Связь технологии с результатом выполнения другой цели.
 */
const BuildFlowLinkToTargetResult = inherit({
    /**
     * @param {String} targetOptionName
     * @param {String} defaultTargetName
     */
    __constructor(targetOptionName, defaultTargetName) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetName = defaultTargetName;
        this._fieldName = `_${targetOptionName}`;
    },
    /**
     * Возвращает имя опции для данной связи.
     *
     * @returns {String}
     */
    getTargetOptionName() {
        return this._targetOptionName;
    },
    /**
     * Сохраняет размаскированное имя цели в поле в инстанции технологии.
     *
     * @param {Tech} tech
     * @param {Node} node
     */
    configureUsages(tech, node) {
        tech[this._fieldName] = node.unmaskTargetName(
            tech._preprocessTargetName(tech.getOption(this._targetOptionName, this._defaultTargetName))
        );
    },
    /**
     * Проверяет валидность кэша.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     * @returns {Boolean}
     */
    isCacheValid(tech, node, cache) {
        const targetName = tech[this._fieldName];
        const targetPath = node.resolvePath(targetName);
        return !cache.needRebuildFile(`target:${targetName}`, targetPath);
    },
    /**
     * Сохраняет в кэш информацию об использованных файлах.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     */
    saveCache(tech, node, cache) {
        const targetName = tech[this._fieldName];
        const targetPath = node.resolvePath(targetName);
        cache.cacheFileInfo(`target:${targetName}`, targetPath);
    },
    /**
     * Требует у ноды выполнения необходимой цели.
     * @param {Tech} tech
     * @param {Node} node
     * @returns {Promise}
     */
    requireTarget(tech, node) {
        const _this = this;
        const processTargetResult = this._processTargetResult;
        return node.requireSources([tech[this._fieldName]]).spread(function (result) {
            return processTargetResult.call(_this, tech, node, result);
        });
    },
    /**
     * Возвращает имя поля, в которое связь пишет имя цели.
     *
     * @returns {String}
     */
    getFieldName() {
        return this._fieldName;
    },
    _processTargetResult(tech, node, result) {
        return result;
    }
});

/**
 * Связь технологии с другой целью без получения результата.
 */
const BuildFlowLinkToTargetNoResult = inherit(BuildFlowLinkToTargetResult, {
    _processTargetResult() {
        return '';
    }
});

/**
 * Связь технологии с абсолютным путем к другой цели.
 */
const BuildFlowLinkToTargetFilename = inherit(BuildFlowLinkToTargetResult, {
    _processTargetResult(tech, node) {
        return node.resolvePath(tech[this._fieldName]);
    }
});

/**
 * Связь технологии с текстовым содержимым файла другой цели.
 */
const BuildFlowLinkToTargetSource = inherit(BuildFlowLinkToTargetResult, {
    _processTargetResult(tech, node) {
        return vowFs.read(node.resolvePath(tech[this._fieldName]), 'utf8');
    }
});

/**
 * Связь технологии со списком файлов (префиксами).
 */
const BuildFlowLinkToFileList = inherit(BuildFlowLinkToTargetResult, {
    /**
     * @param {String} targetOptionName
     * @param {String} defaultTargetName
     * @param {String|Array} defaultSuffixes
     */
    __constructor(targetOptionName, defaultTargetName, defaultSuffixes) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetName = defaultTargetName;
        this._fieldName = `_${targetOptionName}`;
        this._listName = `_list${targetOptionName}`;
        this._suffixesOptionName = 'sourceSuffixes';
        this._defaultSuffixes = defaultSuffixes;
    },
    /**
     * Возвращает имя опции для данной связи.
     *
     * @returns {String}
     */
    getTargetOptionName() {
        return this._targetOptionName;
    },
    /**
     * Проверяет валидность кэша.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     * @returns {Boolean}
     */
    isCacheValid(tech, node, cache) {
        const targetName = tech[this._fieldName];
        return !cache.needRebuildFileList(`target:${targetName}`, tech[this._listName]);
    },
    /**
     * Сохраняет в кэш информацию об использованных файлах.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     * @returns {undefined}
     */
    saveCache(tech, node, cache) {
        const targetName = tech[this._fieldName];
        return cache.cacheFileList(`target:${targetName}`, tech[this._listName]);
    },
    _processTargetResult(tech, node, result) {
        let suffixes = tech.getOption(this._suffixesOptionName) || this._defaultSuffixes;
        suffixes = (Array.isArray(suffixes) ? suffixes : [suffixes]);
        tech[this._listName] = result.getBySuffix(suffixes);
        return tech[this._listName];
    }
});

/**
 * Связь технологии со списком директорий (префиксами).
 */
const BuildFlowLinkToDirList = inherit(BuildFlowLinkToTargetResult, {
    /**
     * @param {String} targetOptionName
     * @param {String} defaultTargetName
     * @param {String|Array} suffixes
     */
    __constructor(targetOptionName, defaultTargetName, suffixes) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetName = defaultTargetName;
        this._fieldName = `_${targetOptionName}`;
        this._listName = `_list${targetOptionName}`;
        this._suffixesOptionName = 'sourceDirSuffixes';
        this._suffixes = suffixes;
    },
    /**
     * Возвращает имя опции для данной связи.
     *
     * @returns {String}
     */
    getTargetOptionName() {
        return this._targetOptionName;
    },
    /**
     * Проверяет валидность кэша.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     * @returns {Boolean}
     */
    isCacheValid(tech, node, cache) {
        const targetName = tech[this._fieldName];
        const files = [].concat.apply([], tech[this._listName].map(function (dir) {
                return dir.files;
            }));
        return !cache.needRebuildFileList(`target:${targetName}`, files);
    },
    /**
     * Сохраняет в кэш информацию об использованных файлах.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     * @returns {undefined}
     */
    saveCache(tech, node, cache) {
        const targetName = tech[this._fieldName];
        const files = [].concat.apply([], tech[this._listName].map(function (dir) {
                return dir.files;
            }));
        return cache.cacheFileList(`target:${targetName}`, files);
    },
    _processTargetResult(tech, node, result) {
        let suffixes = tech.getOption(this._suffixesOptionName) || this._suffixes;
        suffixes = Array.isArray(suffixes) ? suffixes : [suffixes];
        tech[this._listName] = result.getBySuffix(suffixes);
        return tech[this._listName];
    }
});

/**
 * Связь технологии со списком целей.
 */
const BuildFlowLinkToTargetList = inherit({
    /**
     * @param {String} targetOptionName
     * @param {String[]} defaultTargetNames
     * @param {Function} linkClass
     */
    __constructor(targetOptionName, defaultTargetNames, linkClass) {
        this._targetOptionName = targetOptionName;
        this._defaultTargetNames = defaultTargetNames || [];
        this._linkClass = linkClass;
        this._fieldName = `_${targetOptionName}`;
        this._usagesFieldName = `_usageList_${targetOptionName}`;
    },
    /**
     * Возвращает имя опции для данной связи.
     *
     * @returns {String}
     */
    getTargetOptionName() {
        return this._targetOptionName;
    },
    /**
     * Сохраняет размаскированное имя цели в поле в инстанции технологии.
     *
     * @param {Tech} tech
     * @param {Node} node
     */
    configureUsages(tech, node) {
        const _this = this;
        const links = [];
        const targetNames = [];
        const targetOptionName = this._targetOptionName;
        let i = 0;
        tech.getOption(this._targetOptionName, this._defaultTargetNames).forEach(function (targetName) {
            const link = new _this._linkClass(`${targetOptionName}[${i}]`, targetName);
            link.configureUsages(tech, node);
            targetNames.push(tech[link.getFieldName()]);
            links.push(link);
            i++;
        });
        tech[this._fieldName] = targetNames;
        tech[this._usagesFieldName] = links;
    },
    /**
     * Проверяет валидность кэша.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     * @returns {Boolean}
     */
    isCacheValid(tech, node, cache) {
        const links = tech[this._usagesFieldName];
        for (let i = 0, l = links.length; i < l; i++) {
            if (!links[i].isCacheValid(tech, node, cache)) {
                return false;
            }
        }
        return true;
    },
    /**
     * Сохраняет в кэш информацию об использованных файлах.
     *
     * @param {Tech} tech
     * @param {Node} node
     * @param {Cache} cache
     */
    saveCache(tech, node, cache) {
        tech[this._usagesFieldName].forEach(function (link) {
            link.saveCache(tech, node, cache);
        });
    },
    /**
     * Требует у ноды выполнения необходимой цели.
     * @param {Tech} tech
     * @param {Node} node
     * @returns {Promise}
     */
    requireTarget(tech, node) {
        return Vow.all(tech[this._usagesFieldName].map(function (link) {
            return link.requireTarget(tech, node);
        }));
    }
});

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
const BuildFlow = inherit(/** @lends BuildFlow.prototype */ {

    /**
     * Конструктор.
     */
    __constructor() {
        this._name = '';
        this._usages = [];
        this._dependencies = [];
        this._targetOptionName = '';
        this._defaultTargetName = '';
        this._requiredOptions = [];
        this._options = {};
        this._methods = {};
        this._staticMethods = {};
        this._deprecationNotice = null;
        this._optionAliases = {};
        this._inheritTech = BaseTech;
        this._prepareFunc = function () {};
        this._buildFunc = function () {
            throw new Error('You should declare build function using "build" method of BuildFlow.');
        };
        this._wrapFunc = function (data) {
            return data;
        };
        this._saveFunc = function (filename, result) {
            return vowFs.write(filename, result, 'utf8');
        };
        this._cacheValidator = function () {
            return false;
        };
        this._cacheSaver = function () {};
    },

    /**
     * Устанавливает имя технологии.
     * @param {String} techName
     * @returns {BuildFlow}
     */
    name(techName) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._name = techName;
        });
    },

    /**
     * @param {string} thisPackage
     * @param {string} [newPackage]
     * @param {string} [newTech]
     * @param {string} [desc]
     * @returns {BuildFlow}
     */
    deprecated(thisPackage, newPackage, newTech, desc) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._deprecationNotice = {
                thisPackage,
                newPackage,
                newTech,
                desc
            };
        });
    },

    /**
     * Определяет опцию для технологии.
     * @param {String} optionName Имя опции.
     * @param {*} [defaultValue] Значение по умолчанию.
     * @param {String} [fieldName] Имя поля, в которое необходимо записать значение опции
     *  (по умолчанию — "_<имя опции>").
     * @returns {BuildFlow}
     */
    defineOption(optionName, defaultValue, fieldName) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._options[optionName] = {
                fieldName: fieldName || `_${optionName}`,
                defaultValue
            };
        });
    },

    /**
     * Определяет обязательную опцию для технологии.
     * @param {String} optionName Имя опции.
     * @param {String} [fieldName] Имя поля, в которое необходимо записать значение опции
     *  (по умолчанию — "_<имя опции>").
     * @returns {BuildFlow}
     */
    defineRequiredOption(optionName, fieldName) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._options[optionName] = {
                fieldName: fieldName || `_${optionName}`
            };
            buildFlow._requiredOptions.push(optionName);
        });
    },

    /**
     * Объявляет алиас для опции.
     *
     * @param {String} optionName
     * @param {String} aliasName
     * @returns {BuildFlow}
     */
    optionAlias(optionName, aliasName) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._optionAliases[aliasName] = optionName;
        });
    },

    /**
     * Требует список файлов по суффиксу или суффиксам.
     * Например, .useFileList("js") добавит в аргументы билдеру список файлов с расширением js.
     * Значение по умолчанию можно переопределить параметром sourceSuffixes
     * @param {String|Array} defaultSuffixes Значение по умолчанию.
     * @returns {BuildFlow}
     */
    useFileList(defaultSuffixes) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._addUsage(
                new BuildFlowLinkToFileList('filesTarget', '?.files', defaultSuffixes)
            );
        });
    },

    /**
     * Требует список директорий по суффиксу или суффиксам.
     * Например, .useDirList("i18n") добавит в аргументы билдеру список директорий с расширением i18n.
     * @param {String|Array} suffixes
     * @returns {BuildFlow}
     */
    useDirList(suffixes) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._addUsage(
                new BuildFlowLinkToDirList('dirsTarget', '?.dirs', suffixes)
            );
        });
    },

    /**
     * Отменяет требование целей другой ноды.
     * @param {String} name
     * @returns {BuildFlow}
     */
    unuseTarget(name) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._removeUsage(name);
        });
    },

    /**
     * Отменяет требование списка файлов.
     * @returns {BuildFlow}
     */
    unuseFileList() {
        return this._copyAnd(function (buildFlow) {
            buildFlow._removeUsage('filesTarget');
        });
    },

    /**
     * Отменяет требование списка директорий.
     * @returns {BuildFlow}
     */
    unuseDirList() {
        return this._copyAnd(function (buildFlow) {
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
    useSourceFilename(targetOptionName, defaultTargetName) {
        return this._copyAnd(function (buildFlow) {
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
    useSourceListFilenames(targetOptionName, defaultTargetNames) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._addUsage(
                new BuildFlowLinkToTargetList(targetOptionName, defaultTargetNames, BuildFlowLinkToTargetFilename)
            );
        });
    },

    /**
     * Требует содержимое файла другого таргета ноды, объявляет зависимость от этого таргета.
     * В аргументы билдера придет содержимое файла.
     * @param {String} targetOptionName Имя опции для таргета.
     * @param {String} defaultTargetName Значение по умолчанию.
     * @returns {BuildFlow}
     */
    useSourceText(targetOptionName, defaultTargetName) {
        return this._copyAnd(function (buildFlow) {
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
    useSourceResult(targetOptionName, defaultTargetName) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._addUsage(new BuildFlowLinkToTargetResult(targetOptionName, defaultTargetName));
        });
    },

    /**
     * Объявляет зависимость от таргета ноды, но не добявляет аргументов в билдер.
     * @param {String} targetOptionName
     * @param {String} defaultTargetName
     * @returns {BuildFlow}
     */
    dependOn(targetOptionName, defaultTargetName) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._addDep(new BuildFlowLinkToTargetNoResult(targetOptionName, defaultTargetName));
        });
    },

    /**
     * Настраивает таргет для технологии.
     * @param {String} targetOptionName Имя опции, в котором передается таргет.
     * @param {String} defaultTargetName Имя таргета по умолчанию.
     * @returns {BuildFlow}
     */
    target(targetOptionName, defaultTargetName) {
        return this._copyAnd(function (buildFlow) {
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
    builder(func) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._buildFunc = func;
        });
    },

    /**
     * Определяет метод подготовки к сборке. Метод не принимает никаких аргументов.
     *
     * @param {Function} func
     * @returns {BuildFlow}
     */
    prepare(func) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._prepareFunc = func;
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
    needRebuild(func) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._cacheValidator = func;
        });
    },

    /**
     * Сохраняет кэш для того, чтобы избежать лишнюю повторную сборку.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    saveCache(func) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._cacheSaver = func;
        });
    },

    /**
     * Определяет функцию-враппер.
     * В функцию передает строка, которую возвращает билдер.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    wrapper(func) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._wrapFunc = func;
        });
    },

    /**
     * Определяет функцию, сохраняющую результат выполнения билдера.
     * Фунция должна возвратить промис.
     * @param {Function} func
     * @returns {BuildFlow}
     */
    saver(func) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._saveFunc = func;
        });
    },

    /**
     * Определяет набор методов технологии.
     * @param {Object} methods Методы в виде хэш-таблицы (объекта).
     * @returns {BuildFlow}
     */
    methods(methods) {
        return this._copyAnd(function (buildFlow) {
            Object.keys(methods).forEach(function (methodName) {
                buildFlow._methods[methodName] = methods[methodName];
            });
        });
    },

    /**
     * Определяет набор статических методов технологии.
     * @param {Object} staticMethods Методы в виде хэш-таблицы (объекта).
     * @returns {BuildFlow}
     */
    staticMethods(staticMethods) {
        return this._copyAnd(function (buildFlow) {
            Object.keys(staticMethods).forEach(function (methodName) {
                buildFlow._staticMethods[methodName] = staticMethods[methodName];
            });
        });
    },

    /**
     * Создает копию инстанции BuildFlow.
     * @returns {BuildFlow}
     */
    copy() {
        const result = new BuildFlow();
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
        result._prepareFunc = this._prepareFunc;
        result._deprecationNotice = this._deprecationNotice;
        result._inheritTech = this._inheritTech;
        const options = this._options;
        Object.keys(options).forEach(function (optName) {
            result._options[optName] = options[optName];
        });
        const methods = this._methods;
        Object.keys(methods).forEach(function (methodName) {
            result._methods[methodName] = methods[methodName];
        });
        const staticMethods = this._staticMethods;
        Object.keys(staticMethods).forEach(function (methodName) {
            result._staticMethods[methodName] = staticMethods[methodName];
        });
        const optionAliases = this._optionAliases;
        Object.keys(optionAliases).forEach(function (optionName) {
            result._optionAliases[optionName] = optionAliases[optionName];
        });
        return result;
    },

    /**
     * Хэлпер для построения билдера, который просто объединяет файлы, переданные в аргументах.
     * @param {function} wrapper
     * @returns {BuildFlow}
     */
    justJoinFiles(wrapper) {
        return this._copyAnd(function (buildFlow) {
            buildFlow._buildFunc = function () {
                const _this = this;
                return Vow.all(Array.prototype.map.call(arguments, function (arg) {
                    if (typeof arg === 'string') {
                        return vowFs.read(arg, 'utf8').then(function (data) {
                            return wrapper ? wrapper.call(_this, arg, data) : data;
                        });
                    } else if (Array.isArray(arg)) {
                        return _this._joinFiles(arg, wrapper);
                    } else {
                        return '';
                    }
                })).then(function (res) {
                    return res.join(EOL);
                });
            };
        });
    },

    /**
     * Хэлпер для построения билдера, который объединяет файлы, переданные в аргументах, расставляя комментарии
     * о расположении файлов.
     * @returns {BuildFlow}
     */
    justJoinFilesWithComments() {
        return this.justJoinFiles(function (filename, data) {
            const fn = this.node.relativePath(filename);
            return [
                `/* begin: ${fn} */`,
                data,
                `/* end: ${fn} */`
            ].join(EOL);
        });
    },

    /**
     * Хэлпер для построения билдера, который объединяет текст, переданный в аргументах.
     * @returns {BuildFlow}
     */
    justJoinSources() {
        return this._copyAnd(function (buildFlow) {
            buildFlow._buildFunc = function () {
                const _this = this;
                return Vow.all(Array.prototype.map.call(arguments, function (arg) {
                    if (typeof arg === 'string') {
                        return arg;
                    } else if (Array.isArray(arg)) {
                        return _this._joinFiles(arg);
                    } else {
                        return '';
                    }
                })).then(function (res) {
                    return res.join(EOL);
                });
            };
        });
    },
    _addUsage(usage) {
        return this._addToTargetLinks(this._usages, usage);
    },
    _removeUsage(targetOptionName) {
        this._usages = this._usages.filter(function (link) {
            return link.getTargetOptionName() !== targetOptionName;
        });
    },
    _addDep(dep) {
        return this._addToTargetLinks(this._dependencies, dep);
    },
    _addToTargetLinks(links, link) {
        const optionName = link.getTargetOptionName();
        for (let i = 0, l = links.length; i < l; i++) {
            if (links[i].getTargetOptionName() === optionName) {
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
    _copyAnd(func) {
        const result = this.copy();
        func(result);
        return result;
    },

    /**
     * Создает технологию.
     * @returns {Tech}
     */
    createTech() {
        const name = this._name;
        const targetOptionName = this._targetOptionName;
        const defaultTargetName = this._defaultTargetName;
        const usages = this._usages.concat(this._dependencies);
        const requiredOptions = this._requiredOptions;
        const options = this._options;
        const buildFunc = this._buildFunc;
        const saveFunc = this._saveFunc;
        const wrapFunc = this._wrapFunc;
        const cacheValidator = this._cacheValidator;
        const cacheSaver = this._cacheSaver;
        const preparer = this._prepareFunc;
        const methods = this._methods;
        const staticMethods = this._staticMethods;
        const deprecationNotice = this._deprecationNotice;
        const optionAliases = this._optionAliases;
        if (!name) {
            throw new Error('You should declare tech name using "name" method of BuildFlow.');
        }
        if (!targetOptionName) {
            throw new Error('You should declare tech target name using "target" method of BuildFlow.');
        }
        const resultTechMethods = {
            __cacheSaver: cacheSaver,
            __buildFunc: buildFunc,
            __saveFunc: saveFunc,
            __wrapFunc: wrapFunc,
            __preparer: preparer,
            __cacheValidator: cacheValidator,
            configure() {
                const _this = this;
                const node = this.node;
                Object.keys(optionAliases).forEach(function (aliasName) {
                    if (this._options.hasOwnProperty(aliasName)) {
                        const optionName = optionAliases[aliasName];
                        this._options[optionName] = this._options[aliasName];
                        delete this._options[aliasName];
                    }
                }, this);
                options.prependText = { fieldName: '_prependText', defaultValue: '' };
                options.appendText = { fieldName: '_appendText', defaultValue: '' };
                this._optionFieldNames = {};
                Object.keys(options).forEach(function (optName) {
                    const option = options[optName];
                    _this[option.fieldName] = _this.getOption(optName, option.defaultValue);
                    _this._optionFieldNames[optName] = option.fieldName;
                });
                this._target = node.unmaskTargetName(
                    this._preprocessTargetName(defaultTargetName ?
                        _this.getOption(targetOptionName, defaultTargetName) :
                        _this.getRequiredOption(targetOptionName))
                );
                requiredOptions.forEach(function (requiredOption) {
                    _this.getRequiredOption(requiredOption);
                });
                usages.forEach(function (usage) {
                    usage.configureUsages(_this, node);
                });
                this._buildResult = undefined;
            },
            getName() {
                return name;
            },
            getTargets() {
                return [this._target];
            },
            _requireSources() {
                const _this = this;
                const node = this.node;
                return Vow.all(usages.map(function (usage) {
                    return usage.requireTarget(_this, node);
                }));
            },
            _isRebuildRequired() {
                const cache = this.node.getNodeCache(this._target);
                if (this.__cacheValidator.call(this, cache)) {
                    return true;
                }
                if (cache.needRebuildFile('target', this.node.resolvePath(this._target))) {
                    return true;
                }
                for (let i = 0, l = usages.length; i < l; i++) {
                    if (!usages[i].isCacheValid(this, this.node, cache)) {
                        return true;
                    }
                }
                return false;
            },
            _saveCache() {
                const cache = this.node.getNodeCache(this._target);
                cache.cacheFileInfo('target', this.node.resolvePath(this._target));
                for (let i = 0, l = usages.length; i < l; i++) {
                    usages[i].saveCache(this, this.node, cache);
                }
                this.__cacheSaver.call(this, cache);
            },
            _getBuildResult() {
                return this.__buildFunc.apply(this, arguments);
            },
            _saveBuildResult() {
                return this.__saveFunc.apply(this, arguments);
            },
            _wrapBuildResult() {
                return this.__wrapFunc.apply(this, arguments);
            },
            _joinFiles(files, wrapper) {
                const _this = this;
                return Vow.all(files.map(function (fileInfo) {
                    return vowFs.read(fileInfo.fullname, 'utf8').then(function (data) {
                        return wrapper ? wrapper.call(_this, fileInfo.fullname, data) : data;
                    });
                })).then(function (results) {
                    return results.join(EOL);
                });
            },
            _joinFilesWithComments(files) {
                const node = this.node;
                return this._joinFiles(files, function (filename, data) {
                    const fn = node.relativePath(filename);
                    return [
                        `/* begin: ${fn} */`,
                        data,
                        `/* end: ${fn} */`
                    ].join(EOL);
                });
            },
            _preprocessTargetName(targetName) {
                const _this = this;
                return targetName.replace(/{([^}]+)}/g, function (s, optName) {
                    if (_this._optionFieldNames[optName]) {
                        return _this[_this._optionFieldNames[optName]] || '';
                    } else {
                        return _this.getOption(optName, '');
                    }
                });
            },
            setResult(value) {
                this._buildResult = value;
            },
            _prepare() {
                return this.__preparer.call(this);
            },
            build() {
                const _this = this;
                const node = this.node;
                return Vow.when(_this._prepare()).then(function () {
                    if (deprecationNotice) {
                        node.getLogger().logTechIsDeprecated(
                            _this._target,
                            name,
                            deprecationNotice.thisPackage,
                            deprecationNotice.newTech ||
                                (deprecationNotice.newPackage ? name : ''),
                            deprecationNotice.newPackage,
                            deprecationNotice.desc
                        );
                    }
                    return _this._requireSources().then(function (results) {
                        if (_this._isRebuildRequired()) {
                            return Vow.when(_this._getBuildResult.apply(_this, results)).then(function (data) {
                                return Vow.when(_this._wrapBuildResult(data)).then(function (wrappedData) {
                                    wrappedData = _this._prependText + wrappedData + _this._appendText;
                                    return Vow.when(
                                        _this._saveBuildResult(_this.node.resolvePath(_this._target), wrappedData)
                                    ).then(function () {
                                        _this._saveCache();
                                        node.resolveTarget(_this._target, _this._buildResult);
                                    });
                                });
                            });
                        } else {
                            node.isValidTarget(_this._target);
                            node.resolveTarget(_this._target, _this._buildResult);
                            return null;
                        }
                    });
                });
            }
        };
        Object.keys(methods).forEach(function (methodName) {
            resultTechMethods[methodName] = methods[methodName];
        });
        /**
         * Результирующая технология, которая строится на основе инстанции BuildFlow.
         */
        const resultTech = inherit(this._inheritTech, resultTechMethods, staticMethods);
        const _this = this;

        /**
         * Каждому классу технологий добавляем метод buildFlow, чтобы вернуть инстанцию BuildFlow, с помощью которой
         * была построена технология.
         * @returns {BuildFlow}
         */
        resultTech.buildFlow = function () {
            _this._inheritTech = resultTech;
            return _this;
        };
        return resultTech;
    }
});

exports.create = function () {
    return new BuildFlow();
};
