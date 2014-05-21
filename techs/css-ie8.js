/**
 * css-ie8
 * =======
 *
 * Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.
 */

module.exports = require('./css').buildFlow()
    .name('css-ie8')
    .deprecated('enb', 'enb', 'css')
    .target('target', '?.ie8.css')
    .useFileList(['css', 'ie8.css'])
    .createTech();
