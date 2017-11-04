'use strict';

const tty = require('tty');
const chalk = require('chalk');

const enabled = process.env.COLOR || (!process.env.NOCOLOR && tty.isatty(1) && tty.isatty(2));

module.exports = new chalk.constructor({ enabled });
