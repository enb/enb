/**
 * css-ie6
 * =======
 *
 * Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.
 */

module.exports = require('./css').buildFlow()
    .name('css-ie6')
    .deprecated('enb', 'enb', 'css')
    .target('target', '?.ie6.css')
    .useFileList(['css', 'ie6.css'])
    .createTech();
