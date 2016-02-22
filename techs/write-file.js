/**
 * write-file
 * =============
 *
 * Записывает целевой файл в файловую систему.
 *
 * **Опции**
 *
 * * *String* **target** — имя генерируемого файла. Обязательная опция.
 * * *String | Buffer* **content** - контент генерируемого файла, если он есть файл будет сгенерирован
 * * *Object | String* **fileOptions** - [аттрибуты генерируемого файла]{@link https://goo.gl/ZZzrdr} (default: 'utf8')
 *
 * **Пример**
 *
 * Генерируем текстовый-файл
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/write-file'), {
 *      content: 'bla bla bla',
 *      fileOptions: {
 *         encoding: 'utf8', // default
 *         mode: '0o666', // default
 *         flag: 'w' //default
 *      },
 *      target: '?.bla.txt'
 * } ]);
 * ```
 *
 * Генерируем bemdecl-файл
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/write-file'), {
 *      content: 'exports.blocks = {name: "bla"}',
 *      fileOptions: {
 *         encoding: 'utf8', // default
 *         mode: '0o666', // default
 *         flag: 'w' //default
 *      },
 *      target: '?.bemdecl.js'
 * } ]);
 * ```
 */
var enb = require('../lib/api'),
    vfs = enb.asyncFs;

module.exports = enb.buildFlow.create()
    .name('write-file')
    .target('target', '?.target')
    .defineRequiredOption('target')
    .defineRequiredOption('content')
    .defineOption('fileOptions', { encoding: 'utf8' })
    .builder(function () {
        return this._content;
    })
    .saver(function (filename, content) {
        return vfs.write(filename, content, this._fileOptions);
    })
    .createTech();
