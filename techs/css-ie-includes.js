/**
 * css-ie-includes
 * ===============
 *
 * Технология устарела. Используйте технологию `css-includes` с опцией `sourceSuffixes`.
 */

module.exports = require('./css-includes').buildFlow()
    .name('css-ie-includes')
    .deprecated('enb', 'enb', 'css-includes')
    .target('target', '?.ie.css')
    .useFileList(['css', 'ie.css'])
    .createTech();
