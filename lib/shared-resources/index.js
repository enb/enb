/**
 * SharedResources
 *
 * Набор ресурсов, расшаренных между технологиями
 */

var JobQueue = require('./job-queue');
var FileCache = require('./file-cache');
var inherit = require('inherit');

module.exports = inherit({
    // TODO: pass config
    __constructor: function () {
        this.jobQueue = new JobQueue();
        this.fileCache = new FileCache(); // TODO: use cache dir from config
    },

    destruct: function () {
        this.fileCache.destruct();
        this.jobQueue.destruct();
    }
});
