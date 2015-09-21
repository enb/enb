var path = require('path'),
    vow = require('vow'),
    MakePlatform = require('../make'),
    cdir = process.cwd();

/**
 * Запускает сборку.
 * Может запустить либо сборку таргетов, либо запуск тасков.
 *
 * @param {String[]} [targets]  Список целей в файловой системе, которые нужно собрать.
 * @param {Object}   [options]
 * @param {String}   [options.dir=process.cwd()]  Корень проекта.
 * @param {String}   [options.mode=development]   Режим сборки.
 * @param {Object}   [options.config]             Конфиг сборки. По умолчанию загружается из `.enb/make.js`.
 * @param {Boolean}  [options.cache=true]         Учитывать кэш при запуске таска.
 * @param {Boolean}  [options.graph=false]        Выводить граф сборки.
 * @param {Boolean}  [options.hideWarnings=false] Не выводить warning-сообщения в консоль.
 * @returns {Promise}
 */
module.exports = function (targets, options) {
    targets = targets || [];
    options = options || {};

    if (arguments.length === 1 && !Array.isArray(targets)) {
        options = targets;
        targets = [];
    }

    var makePlatform = new MakePlatform(),
        root = path.resolve(options.dir || cdir),
        cache = options.hasOwnProperty('cache') ? options.cache : true,
        logger,
        graph;

    return makePlatform.init(root, options.mode, options.config)
        .then(function () {
            logger = makePlatform.getLogger();

            if (options.graph) {
                graph = makePlatform.getBuildGraph();
            }

            if (options.hideWarnings) {
                logger.hideWarnings();
            }

            if (cache) {
                makePlatform.loadCache();
            }

            return makePlatform.build(targets)
                .then(function () {
                    if (graph) {
                        console.log(graph.render());
                    }

                    return vow.when(makePlatform.saveCacheAsync(), makePlatform.destruct.bind(makePlatform));
                });
        })
        .fail(function (err) {
            if (graph) {
                console.log(graph.render());
            }

            if (logger) {
                logger.log('build failed');
            }

            throw err;
        });
};
