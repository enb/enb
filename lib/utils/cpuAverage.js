/**
 * cpuAverage
 * ==========
 *
 * Utility to get CPU information.
 */

var os = require('os');

function cpuAverage() {
    var totalIdle = 0;
    var totalTick = 0;
    var cpus = os.cpus();

    for (var i = 0, len = cpus.length; i < len; i++) {
        var cpu = cpus[i];

        // Total up the time in the cores tick
        for (var type in cpu.times) {
            totalTick += cpu.times[type];
        }

        // Total up the idle time of the core
        totalIdle += cpu.times.idle;
    }

    // Return the average among all cores Idle and Tick times
    return {
        idle: totalIdle / cpus.length,
        total: totalTick / cpus.length
    };
}

module.exports = cpuAverage;
