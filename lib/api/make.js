var path = require('path');
var vow = require('vow');
var MakePlatform = require('../make');

/**
 * Запускает сборку.
 * Может запустить либо сборку таргетов, либо запуск тасков.
 *
 * @param {String[]} [targets]  Список целей в файловой системе, которые нужно собрать.
 * @param {Object}   [options]
 * @param {String}   [options.dir=process.cwd()]  Корень проекта.
 * @param {String}   [options.mode=development]   Режим сборки.
 * @param {Boolean}  [options.cache=true]         Учитывать кэш при запуске таска.
 * @param {Boolean}  [options.graph=false]        Выводить граф сборки.
 * @param {Boolean}  [options.hideWarnings=false] Не выводить warning-сообщения в консоль.
 * @returns {Promise}
 */
module.exports = function (targets, options) {
    var makePlatform = new MakePlatform();
    var root = path.resolve(options.dir);
    var logger;
    var graph;

    return makePlatform.init(root, options.mode)
        .then(function () {
            logger = makePlatform.getLogger();

            if (options.graph) {
                graph = makePlatform.getBuildGraph();
            }

            if (options.hideWarnings) {
                logger.hideWarnings();
            }

            if (!options.cache) {
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
