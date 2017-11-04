'use strict';

/**
 * SharedResources
 *
 * Набор ресурсов, расшаренных между технологиями
 */

var JobQueue = require('./job-queue');
var inherit = require('inherit');

module.exports = inherit({
    __constructor() {
        this.jobQueue = new JobQueue();
    },

    destruct() {
        this.jobQueue.destruct();
    }
});
