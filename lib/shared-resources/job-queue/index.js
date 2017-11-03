/**
 * JobQueue
 *
 * Очередь для выполнения тасок в параллельных подпроцессах
 */

var inherit = require('inherit'),
    workerFarm = require('worker-farm'),
    vowNode = require('vow-node');

module.exports = inherit({
    __constructor: function () {
        this._workers = null;
    },

    destruct: function () {
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
    push: function () {
        if (!this._workers) {
            this._workers = workerFarm(require.resolve('./processor'));
            this.push = this._process;
        }

        return this._process.apply(this, arguments);
    },

    _process: function (path) {
        var args = [].slice.call(arguments, 1),
            workers = this._workers.bind(this._workers, path, args);

        return vowNode.invoke(workers);
    }
});
