/**
 * css-ie9
 * =======
 *
 * Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.
 */

module.exports = require('./css').buildFlow()
    .name('css-ie9')
    .deprecated('enb', 'enb', 'css')
    .target('target', '?.ie9.css')
    .useFileList(['css', 'ie9.css'])
    .createTech();
