Как написать свою технологию?
=============================

С версии 0.8 технологии рекомендуется писать с использованием хэлпера `BuildFlow`.

Исходный код хэлпера: https://github.com/enb/enb/blob/master/lib/build-flow.js

В данном руководстве охвачены не все возможности `BuildFlow`. Полный перечень методов с описанием находится
в JSDoc файла `build-flow.js`.

Теория
------

Цель технологии — собирать таргет в ноде. Например, технология `css` может собрать `index.css` в ноде `pages/index`
на основе `css`-файлов по уровням переопределения.

Каждая технология умеет принимать настройки.
Хэлпер `BuildFlow` способствует тому, чтобы максимальное количество параметров было настраиваемым.

Технологии могут использовать результат выполнения других технологий. Например, список исходных `css`-файлов
строится с помощью технологии `files`.

В общем случае, технологии создавать несложно. Бывают необычные ситуации.
В этом руководстве я постараюсь охватить и такие случаи.

Технология для склеивания файлов по суффиксу
--------------------------------------------

В общем случае технология для склеивания файлов по нужному суффиксу выглядит следующим образом:

```javascript
module.exports = require('enb/lib/build-flow').create() // Создаем инстанцию BuildFlow
    .name('js') // Выбираем имя для технологии
    .target('target', '?.js') // Имя опции для задания имени результирующего файла и значение по умолчанию
    .useFileList('js') // Указываем, какие суффиксы нас интересуют при сборке
    .justJoinFilesWithComments() // Еще один хэлпер. Склеивает результат, обрамляя комментариями вида /* ... */
                                 // в которых указывается путь к исходному файлу, из которого был сформирован фрагмент.
    .createTech(); // Создаем технологию с помощью хэлпера
```

Этот пример, конечно очень общий и слишком упрощенный.

Рассмотрим аналог этой технологии без использования `justJoinFilesWithComments`:

```javascript
var Vow = require('vow'); // Используемая в ENB библиотека промисов
var vowFs = require('vow-fs'); // Работа с файловой системой на основе Vow

module.exports = require('enb/lib/build-flow').create()
    .name('js')
    .target('target', '?.js')
    .useFileList('js')
    .builder(function(jsFiles) { // Будем возвращать промис, чтобы ENB ждал выполнения асинхронной технологии
        var node = this.node; // Сохраняем ссылку на инстанцию класса `Node`.
        return Vow.all(jsFiles.map(function(file) { // Ждем выполнения всех промисов
            return vowFs.read(file.fullname, 'utf8').then(function(data) { // Читаем каждый исходный файл
                var filename = node.relativePath(file.fullname); // Получаем путь относительно ноды
                // Строим фрагменты из содержимого исходных файлов
                return '/* begin: ' + filename + ' *' + '/\n' + data + '\n/* end: ' + filename + ' *' + '/';
            });
        })).then(function(contents) { // Получили результат обработки всех исходных файлов
            return contents.join('\n'); // Объединяем полученные фрагменты с помощью перевода строки
        });
    })
    .createTech();
```

Так как мы использовали метод `useFileList`, в `builder` пришел аргумент со списком файлов по указанному суффиксу.
Каждый `use`-метод добавляет аргумент в `builder`. Тип и содержимое аргументов зависят от того, какой `use`-метод был
использован.

Добавим к получившейся технологии файлы интернационализации:

```javascript
var Vow = require('vow'); // Используемая в ENB библиотека промисов
var vowFs = require('vow-fs'); // Работа с файловой системой на основе Vow

module.exports = require('enb/lib/build-flow').create()
    .name('js')
    .target('target', '?.js')
    .defineRequiredOption('lang') // Определяем обязательную опцию lang для задания языка
    .useFileList('js')

    .useSourceText('allLangTarget', '?.lang.all.js') // Подключаем общую для всех языков интернационализацию,
                                                     // используя метод useSourceText, который добавляет в
                                                     // builder содержимое указанного файла в виде аргумента

    .useSourceText('langTarget', '?.lang.{lang}.js') // Подключаем кейсеты конкретного языка;
                                                     // здесь используется значение опции lang для того,
                                                     // чтобы сформировать значение по умолчанию

    .builder(function(jsFiles, allLangText, langText) {
        var node = this.node;
        return Vow.all(jsFiles.map(function(file) {
            return vowFs.read(file.fullname, 'utf8').then(function(data) {
                var filename = node.relativePath(file.fullname);
                return '/* begin: ' + filename + ' *' + '/\n' + data + '\n/* end: ' + filename + ' *' + '/';
            });
        })).then(function(contents) {
            return contents
                .concat([allLangText, langText]) // Добавляем фрагменты содержимого файлов интернационализации
                .join('\n');
        });
    })
    .createTech();
```

Технология для склеивания нескольких целей
------------------------------------------

Рассмотрим готовый пример:

```javascript
// В данном примере строится локализованный priv.js
module.exports = require('enb/lib/build-flow').create()
    .name('priv-js-i18n')
    .target('target', '?.{lang}.priv.js')
    .defineRequiredOption('lang')

    // Все эти цели подготавливаются другими технологиями:

    .useSourceFilename('allLangTarget', '?.lang.all.js') // Устанавливаем зависимость от имени файла
                                                         // общей интернационализации

    .useSourceFilename('langTarget', '?.lang.{lang}.js') // Устанавливаем зависимость от имени файла
                                                         // конкретного языка

    .useSourceFilename('privJsTarget', '?.priv.js') // Устанавливаем зависимость от имени файла
                                                    // priv-js файла

    .justJoinFilesWithComments() // Пользуемся хэлпером для склеивания

    .createTech();
```

Реализуем склеивание без хэлпера:

```javascript
module.exports = require('enb/lib/build-flow').create()
    .name('priv-js-i18n')
    .target('target', '?.{lang}.priv.js')
    .defineRequiredOption('lang')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .useSourceFilename('privJsTarget', '?.priv.js')

    .builder(function(allLangFilename, langFilename, privJsFilename) {
        var node = this.node;
        // Перебираем исходные файлы
        return Vow.all([allLangFilename, langFilename, privJsFilename].map(function(absoluteFilename) {
            // Читаем каждый исходный файл
            return vowFs.read(absoluteFilename, 'utf8').then(function(data) {
                // Получаем относительный путь к файлу
                var filename = node.relativePath(absoluteFilename);

                // Формируем фрагмент
                return '/* begin: ' + filename + ' *' + '/\n' + data + '\n/* end: ' + filename + ' *' + '/';
            });
        })).then(function(contents) {
            return contents.join('\n'); // Склеиваем фрагменты
        });
    })

    .createTech();
```

Зависимости от файлов, не входящих в сборку
-------------------------------------------

Например, нам надо добавить модульную систему в начало какого-нибудь файла и сохранить результат под новым именем:

```javascript
var vowFs = require('vow-fs'); // Подключаем модуль для работы с файловой системой
var path = require('path'); // Подключаем утилиты работу с путями

module.exports = require('enb/lib/build-flow').create()
    .name('prepend-modules')
    .target('target', '?.js')
    .defineRequiredOption('source') // Указываем обязательную опцию
    .useSourceText('source', '?') // Устанавливаем зависимость от содержимого цели, задаваемой опцией source
    .needRebuild(function(cache) { // Указываем дополнительную проверку кэша
        // В данном случае модульная система не находится в исходных уровнях переопределения,
        // но ее можно найти в пакете ym; для того, чтобы пересборка правильно работало в случае
        // изменения содержимого файла modules.js, добавляем проверку
        this._modulesFile = path.join(__dirname, '..', 'node_modules', 'ym', 'modules.js'); // Формируем путь
        return cache.needRebuildFile( // Проверяем, изменился ли файл
            'modules-file', // Ключ для кэширования данных о файле; должен быть уникален в рамках технологии
            this._modulesFile // Путь к файлу, для которого необходимо проверить кэш
        );
    })
    .saveCache(function(cache) { // Сохраняем в кэш данные об использованном файле
        cache.cacheFileInfo( // Сохраняем в кэш информацию о файле
            'modules-file', // Ключ для кэширования данных о файле; должен быть уникален в рамках технологии
            this._modulesFile // Путь к файлу, для которого необходимо проверить кэш
        );
    })
    .builder(function(preTargetSource) {
        // Считываем содержимое файла модульной системы
        return vowFs.read(this._modulesFile, 'utf8').then(function(modulesRes) {
            return modulesRes + preTargetSource; // Объединяем результаты
        });
    })
    .createTech();
```

### То же самое, но чуть-чуть иначе

Время от времени возникают ситуации, когда надо немного дополнить существующие технологии.

Например, нам нравится, как работает технология `css`:

```javascript
module.exports = require('enb/lib/build-flow').create()
    .name('css')
    .target('target', '?.css')
    .useFileList('css')
    .builder(function(cssFiles) {
        // ...
    })
    .methods({
        // ...
    })
    .createTech();
```

В каждой технологии, сделанной с помощью `BuildFlow`, есть метод `buildFlow()`, который можно вызвать для того,
чтобы создать новую технологию на основе функционала существующей.

В какой-то момент нам понадобилось вместе с суффиксами `css` собирать еще и `light.css`.
Для этого надо написать новую технологию, заимствуя функционал старой:

```javascript
module.exports = require('enb/techs/css').buildFlow()
    .name('css-light') // Изменяем имя
    .useFileList(['css', 'light.css']) // Изменяем нужные параметры
    .createTech();
```

