/**
 * css-ie7
 * =======
 *
 * Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.
 */

module.exports = require('./css').buildFlow()
    .name('css-ie7')
    .deprecated('enb', 'enb', 'css')
    .target('target', '?.ie7.css')
    .useFileList(['css', 'ie7.css'])
    .createTech();
