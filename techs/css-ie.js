/**
 * css-ie
 * ======
 *
 * Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.
 */

module.exports = require('./css').buildFlow()
    .name('css-ie')
    .deprecated('enb', 'enb', 'css')
    .target('target', '?.ie.css')
    .useFileList(['css', 'ie.css'])
    .createTech();
