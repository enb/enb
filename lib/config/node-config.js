/**
 * NodeConfig
 * ==========
 */
var path = require('path');
var inherit = require('inherit');
var ModeConfig = require('./mode-config');
var sep = path.sep;

/**
 * NodeConfig передается в коллбэки при объявлении ноды (ProjectConfig::node)
 * и при матчинге ноды (ProjectConfig::nodeMask).
 * @name NodeConfig
 */
module.exports = inherit(require('./configurable'), /** @lends NodeConfig.prototype */ {
    /**
     * Конструктор.
     * @param {String} nodePath Относительный путь к ноде.
     * @param {String} root Абсолютный путь к корню проекта.
     * @param {ProjectConfig} projectConfig Ссылка на конфигурацию проекта.
     */
    __constructor(nodePath, root, projectConfig) {
        this.__base();
        this._baseName = path.basename(nodePath);
        this._path = nodePath;
        this._root = root;
        this._targets = [];
        this._cleanTargets = [];
        this._techs = [];
        this._languages = null;
        this._projectConfig = projectConfig;
        this._modes = {};
    },

    /**
     * Конфигурирует ноду для заданного режима.
     * Например:
     * ```javascript
     * config.node('pages/index', function (nodeConfig) {
     *     ...
     *     nodeConfig.mode('development', function (nodeConfig) {
     *         nodeConfig.addTech(require('file-copy'), { sourceTarget: '?.js', destTarget: '_?.js' });
     *     });
     *     nodeConfig.mode('production', function (nodeConfig) {
     *         nodeConfig.addTech(require('borschik'), { sourceTarget: '?.js', destTarget: '_?.js' });
     *     });
     * });
     * ```
     * @param {String} modeName
     * @param {Function} cb
     * @returns {NodeConfig}
     */
    mode(modeName, cb) {
        var modeConfig = this._modes[modeName];
        if (!modeConfig) {
            modeConfig = this._modes[modeName] = new ModeConfig(modeName);
        }
        modeConfig.addChain(cb);
        return this;
    },

    /**
     * Возвращает конфигуратор ноды для заданного режима.
     * @param {String} modeName
     * @returns {ModeConfig|undefined}
     */
    getModeConfig(modeName) {
        return this._modes[modeName];
    },

    /**
     * Устанавливает языки для ноды.
     * @param {String[]} languages
     * @return {NodeConfig}
     */
    setLanguages(languages) {
        this._languages = languages;
        return this;
    },

    /**
     * Возвращает языки для ноды.
     * @returns {String[]}
     */
    getLanguages() {
        return this._languages;
    },

    /**
     * Возвращает абсолютный путь к ноде.
     * @returns {String}
     */
    getNodePath() {
        return this._root + sep + this._path;
    },

    /**
     * Возвращает абсолютный путь к файлу на основе пути, относительно ноды.
     * @param {String} filename
     * @returns {String}
     */
    resolvePath(filename) {
        return this._root + sep + this._path + (filename ? sep + filename : '');
    },

    _processTarget(target) {
        var targetSources = {
            lang: this._languages || this._projectConfig.getLanguages()
        };
        var targets = [];
        var newTargetsToProcess;

        target = target.replace(/^\/+|\/+$/g, '').replace(/\?/g, this._baseName);

        function processTarget (targetName) {
            var match = targetName.match(/{(\w+)}/);
            if (match) {
                var varName = match[1];
                var values = targetSources[varName] || [];
                var regex = new RegExp('{' + varName + '}', 'g');
                if (values.length) {
                    values.forEach(function (value) {
                        newTargetsToProcess.push(targetName.replace(regex, value));
                    });
                } else {
                    newTargetsToProcess.push(targetName.replace(regex, ''));
                }
            } else {
                targets.push(targetName);
            }
        }

        if (/{\w+}/.test(target)) {
            var targetsToProcess = [target];
            while (targetsToProcess.length) {
                newTargetsToProcess = [];
                targetsToProcess.forEach(processTarget);
                targetsToProcess = newTargetsToProcess;
            }
        } else {
            targets.push(target);
        }
        return targets;
    },

    /**
     * Добавляет таргеты.
     * @param {String[]} targets
     * @returns {NodeConfig}
     */
    addTargets(targets) {
        var _this = this;
        targets.forEach(function (target) {
            _this.addTarget(target);
        });
        return this;
    },

    /**
     * Добавляет таргет.
     * @param {String} target
     * @returns {NodeConfig}
     */
    addTarget(target) {
        this._targets = this._targets.concat(this._processTarget(target));
        return this;
    },

    /**
     * Добавляет таргеты, которые необходимо удалять при make clean.
     * @param {String[]} targets
     * @returns {NodeConfig}
     */
    addCleanTargets(targets) {
        var _this = this;
        targets.forEach(function (target) {
            _this.addCleanTarget(target);
        });
        return this;
    },

    /**
     * Добавляет таргет, который необходимо удалять при make clean.
     * @param {String} target
     * @returns {NodeConfig}
     */
    addCleanTarget(target) {
        this._cleanTargets = this._cleanTargets.concat(this._processTarget(target));
        return this;
    },

    /**
     * Добавляет технологии.
     * @param {Array} techs
     * @returns {NodeConfig}
     */
    addTechs(techs) {
        var _this = this;
        techs.forEach(function (tech) {
            _this.addTech(tech);
        });
        return this;
    },

    _processTechOptions(options) {
        var processLangs = false;
        var optVal;
        var i;
        var p;
        for (i in options) {
            if (options.hasOwnProperty(i) &&
                typeof (optVal = options[i]) === 'string' &&
                optVal.indexOf('{lang}') !== -1
            ) {
                processLangs = true;
                break;
            }
        }
        if (processLangs) {
            var result = [];
            var langs = this._languages || this._projectConfig.getLanguages();
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

    /**
     * Добавляет технологию.
     * @param {Tech|Function|Array} tech
     * @returns {NodeConfig}
     */
    addTech(tech) {
        var TechClass;
        if (Array.isArray(tech)) {
            var techOptions = tech[1] || {};
            var techOptionList = this._processTechOptions(techOptions);
            TechClass = tech[0];
            for (var i = 0, l = techOptionList.length; i < l; i++) {
                this._techs.push(new TechClass(techOptionList[i]));
            }
        } else if (typeof tech === 'function') {
            TechClass = tech;
            this._techs.push(new TechClass());
        } else {
            this._techs.push(tech);
        }
        return this;
    },

    getTargets() {
        return this._targets;
    },
    getCleanTargets() {
        return this._cleanTargets;
    },
    getTechs() {
        return this._techs;
    },
    getPath() {
        return this._path;
    }
});
