'use strict';

/**
 * SharedResources
 *
 * Набор ресурсов, расшаренных между технологиями
 */

const inherit = require('inherit');

const JobQueue = require('./job-queue');

module.exports = inherit({
    __constructor() {
        this.jobQueue = new JobQueue();
    },

    destruct() {
        this.jobQueue.destruct();
    }
});
