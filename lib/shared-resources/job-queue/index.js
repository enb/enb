/**
 * JobQueue
 *
 * Очередь для выполнения тасок в параллельных подпроцессах
 */

var inherit = require('inherit');
var workerFarm = require('worker-farm');
var vow = require('vow');

module.exports = inherit({
    ///
    __constructor: function () {
        this._workers = null;
    },

    ///
    destruct: function () {
        if (this._workers) {
            workerFarm.end(this._workers);
            this._workers = null;
        }
    },

    /**
     * Добавить задачу в очередь исполнения
     * @param {String} path путь к модулю-обработчику
     * @param {...} args аргументы, передаваемые в обработчик
     * @return {Promise} промис с результатом выполнения задачи
     */
    push: function () {
        if (!this._workers) {
            this._workers = workerFarm(require.resolve('./processor'));
            this.push = this._process;
        }

        return this._process.apply(this, arguments);
    },

    ///
    _process: function (path) {
        var promise = vow.promise();
        var args = [].slice.call(arguments, 1);

        this._workers(path, args, function (res) {
            return res.err ? promise.reject(res.err) : promise.fulfill(res.val);
        });
        return promise;
    }
});
