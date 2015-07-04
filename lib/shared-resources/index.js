/**
 * SharedResources
 *
 * Набор ресурсов, расшаренных между технологиями
 */

var JobQueue = require('./job-queue');
var inherit = require('inherit');

module.exports = inherit({
    ///
    __constructor: function() {
        this.jobQueue = new JobQueue();
    },

    ///
    destruct: function() {
        this.jobQueue.destruct();
    }
});
