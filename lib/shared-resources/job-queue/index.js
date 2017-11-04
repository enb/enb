'use strict';

/**
 * JobQueue
 *
 * Очередь для выполнения тасок в параллельных подпроцессах
 */

const inherit = require('inherit');
const workerFarm = require('worker-farm');
const vowNode = require('vow-node');

module.exports = inherit({
    __constructor() {
        this._workers = null;
    },

    destruct() {
        if (this._workers) {
            workerFarm.end(this._workers);
            this._workers = null;
        }
    },

    /**
     * Добавить задачу в очередь исполнения
     * @param {String} path путь к модулю-обработчику
     * @return {Promise} промис с результатом выполнения задачи
     */
    push() {
        if (!this._workers) {
            this._workers = workerFarm(require.resolve('./processor'));
            this.push = this._process;
        }

        return this._process.apply(this, arguments);
    },

    _process(path) {
        const args = [].slice.call(arguments, 1);
        const workers = this._workers.bind(this._workers, path, args);

        return vowNode.invoke(workers);
    }
});
