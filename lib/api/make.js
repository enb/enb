'use strict';

const path = require('path');
const vow = require('vow');
const vfs = require('vow-fs');
const colors = require('../ui/colorize');
const MakePlatform = require('../make');
const cdir = process.cwd();
const TargetNotFoundError = require('../errors/target-not-found-error');

/**
 * Запускает сборку.
 * Может запустить либо сборку таргетов, либо запуск тасков.
 *
 * @param {string[]} [targets]  Список целей в файловой системе, которые нужно собрать.
 * @param {Object}   [options]
 * @param {string}   [options.dir=process.cwd()]  Корень проекта.
 * @param {string}   [options.mode=development]   Режим сборки.
 * @param {Function} [options.config]             Функция, которая инициирует конфиг сборки.
												  По умолчанию загружается из `.enb/make.js`.
 * @param {boolean}  [options.cache=true]         Учитывать кэш при запуске таска.
 * @param {boolean}  [options.graph=false]        Выводить граф сборки.
 * @param {boolean}  [options.strict=true]        Строгий режим, при котором сборка завершается ошибкой,
 *                                                если запрашиваемый таргет не существует.
 * @param {boolean}  [options.hideWarnings=false] Не выводить warning-сообщения в консоль.
 * @param {string}   [options.logLevel=info]      Уровень логирования.
 * @param {string}   [options.buildInfoFile]      Путь к файлу, в который нужно записать информацию о сборке.
 * @returns {Promise}
 */
module.exports = function (targets, options) {
    const startTime = new Date();

    targets = targets || [];
    options = options || {};

    if (arguments.length === 1 && !Array.isArray(targets)) {
        options = targets;
        targets = [];
    }

    const makePlatform = new MakePlatform();
    const root = path.resolve(options.dir || cdir);
    const cache = options.hasOwnProperty('cache') ? options.cache : true;
    const isStrict = options.hasOwnProperty('strict') ? options.strict : true;
    const needProfiler = Boolean(options.profiler || options.profilerPercentiles && options.profilerPercentiles.length);
    const buildInfoFilename = typeof options.buildInfoFile === 'string' && path.resolve(options.buildInfoFile);
    let logger;
    let graph;

    function saveBuildInfo(buildInfo) {
        if (buildInfoFilename) {
            const dirname = path.dirname(buildInfoFilename);

            return vfs.makeDir(dirname)
                .then(function () {
                    return vfs.write(buildInfoFilename, JSON.stringify(buildInfo, null, 4));
                })
                .then(function () {
                    return buildInfo;
                });
        }

        return buildInfo;
    }

    return makePlatform.init(root, options.mode, options.config, { graph: options.graph, profiler: needProfiler })
        .then(function () {
            logger = makePlatform.getLogger();

            logger.log('build started');

            if (options.graph) {
                graph = makePlatform.getBuildGraph();
            }

            if (options.hideWarnings) {
                logger.hideWarnings();
            }

            if (options.logLevel) {
                logger.setLogLevel(options.logLevel);
            }

            if (cache) {
                makePlatform.loadCache();
            }

            return makePlatform.build(targets)
                .then(function () {
                    if (graph) {
                        console.log(graph.render());
                    }

                    const finishTime = new Date() - startTime;
                    const message = 'build finished - ' + colors.red(finishTime + 'ms');

                    logger.log(message);

                    return vow.when(makePlatform.saveCacheAsync(), makePlatform.destruct.bind(makePlatform))
                        .then(function () {
                            if (needProfiler) {
                                const percentileRanks = options.profilerPercentiles;
                                const profiler = makePlatform.getBuildProfiler();
                                const buildTimes = profiler.calculateBuildTimes(makePlatform.getBuildGraph());
                                const techMetrics = profiler.calculateTechMetrics(buildTimes);

                                const result = {
                                    buildTimes,
                                    techMetrics,
                                };

                                if (percentileRanks && percentileRanks.length) {
                                    result.techPercentiles = profiler.calculateTechPercentiles(
                                        techMetrics, percentileRanks);
                                }

                                return result;
                            }

                            return {};
                        });
                });
        })
        .then(saveBuildInfo)
        .fail(function (err) {
            if (graph) {
                console.log(graph.render());
            }

            if (!isStrict && err instanceof TargetNotFoundError) {
                logger.log('build finished - ' + colors.red((new Date() - startTime) + 'ms'));
                return;
            }

            if (logger) {
                logger.log('build failed');
            }

            throw err;
        });
};
