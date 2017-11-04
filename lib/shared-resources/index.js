'use strict';

/**
 * SharedResources
 *
 * Набор ресурсов, расшаренных между технологиями
 */

const JobQueue = require('./job-queue');
const inherit = require('inherit');

module.exports = inherit({
    __constructor() {
        this.jobQueue = new JobQueue();
    },

    destruct() {
        this.jobQueue.destruct();
    }
});
