'use strict';

var tty = require('tty');
var chalk = require('chalk');

var enabled = process.env.COLOR || (!process.env.NOCOLOR && tty.isatty(1) && tty.isatty(2));

module.exports = new chalk.constructor({ enabled });
