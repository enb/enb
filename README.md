ENB
===

[![NPM version](http://img.shields.io/npm/v/enb.svg?style=flat)](http://www.npmjs.org/package/enb) [![Build Status](http://img.shields.io/travis/enb/enb/master.svg?style=flat&label=tests)](https://travis-ci.org/enb/enb) [![Build status](http://img.shields.io/appveyor/ci/blond/enb.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb) [![Coverage Status](https://img.shields.io/coveralls/enb/enb.svg?style=flat)](https://coveralls.io/r/enb/enb?branch=master) [![Dependency Status](http://img.shields.io/david/enb/enb.svg?style=flat)](https://david-dm.org/enb/enb)

Сборщик проектов. С помощью ENB можно собрать любой проект, который строится на модели node / target.

**Возможности**

* Сборка проекта и конкретных таргетов в разных режимах (с помощью ENV-переменной `YENV`).
* Режим сервера как в виде самостоятельного express-сервера, так и в виде express-middleware.

**Зачем нужен этот проект, если есть bem-tools?**

ENB работает гораздо быстрее, чем bem-tools. Причем, как в режиме сборки, так и в режиме сервера.

**Почему?**

* Гибкая система кэширования.
* Обмен промежуточными данными в процессе сборки.
* Разбиение технологий на более мелкие (избавляемся от повторной работы).
* Используются более быстрые библиотеки (например, https://github.com/dfilatov/jspromise вместо Q).
* Нет порядка выполнения технологий (технологии зависят от таргетов, а не друг от друга), технологии зачастую выполняются параллельно.
* Тяжелые синхронные технологии выделяются в субпроцессы.

**Некоторые отличия от bem-tools**

* ENB (как платформа) свободна от идеологии BEM. Сбор префиксов не является частью платформы, а реализуется с помощью одной из технологий.
* Технологии в ENB не ограничены в том, каким образом они будут собирать те или иные таргеты.
* Все технологии настраиваемые (в большей или меньшей степени).
* ENB сложнее настроить для проекта. В нем нет готовых шаблонов make-файлов.
* В рамках ENB одна и та же технология может быть использована с разными опциями. Например, можно построить несколько разных `deps.js` в рамках одной ноды на основе различных `bemdecl.js`.

**Как потестить?**

Специально для этого я подготовил сборку project-stub на ENB: https://github.com/mdevils/project-stub

**Пакеты для ENB**

* Сборка BEMHTML: https://github.com/enb/enb-bemhtml
* Модульность для нового bem-core: https://github.com/enb/enb-modules
* Интеграция для grunt: https://github.com/megatolya/grunt-enb

Благодарности
-------------

* Дмитрию Филатову (@dfilatov). За `vow`, `vow-fs`, `inherit`, советы, поддержку и мотивацию.
* Дмитрию Ковалю (@smith). За помощь в сборке тестов, production-режима и здоровый скептицизм.
* Александру Тармолову (@hevil). За помощь с `git`, `modules`, поддержку и полезные ссылки.
* Вениамину Клещенкову (@benjamin). За помощь в отладке и доработке ENB, поддержку, советы и ревью.
* Сергею Бережному (@veged). За `borschik`, советы и правильные вопросы.
* Команде разработчиков bem-tools. За часть заимствованного кода.
* Егору Блинову (@escaton). За пулл-реквесты, идеи.
* Андрею Абрамову (@blond). За пулл-реквесты.

Использование из командной строки
---------------------------------

Предполагается, что вы установили `npm`-пакет `enb` и находитесь в корне проекта.

Сборка всех страниц проекта:
```
./node_modules/.bin/enb make
```

Сборка всех страниц проекта со сбросом кэша:
```
./node_modules/.bin/enb make --no-cache
```

Сборка всех страниц проекта с построением графа сборки:
```
./node_modules/.bin/enb make --graph
```

Сборка конкретной страницы проекта:
```
./node_modules/.bin/enb make pages/index
```

Сборка конкретного файла:
```
./node_modules/.bin/enb make pages/index/index.html
```

Запуск в режиме сервера:
```
./node_modules/.bin/enb server
```

Отключение цветового форматирования при выводе прогресса в консоль:
```
NOCOLOR=1 ./node_modules/.bin/enb make
```

Установка лимита открытых файлов для асинхронных операций. Правильно выбранный лимит позволяет избежать `EMFILE`-ошибок:
```
ENB_FILE_LIMIT=100 ./node_modules/.bin/enb make
```

Терминология
------------

* Target (таргет) — это цель для сборки. Например, таргетом может быть `index.js` в рамках ноды `pages/index`..
* Node (нода) — это папка, в которой находятся те или иные таргеты. Например, `pages/index`.
* Suffix (суффикс) — это расширение исходного или конечного файла. Например, `js`.
* Masked Target (замаскированный таргет) — это имя таргета, которое может содержать `?`. Знак `?` заменяется на имя ноды в процессе настройки технологии, а с помощью подстроки `{lang}` можно создать несколько копий технологии для каждого из языков, где `{lang}` заменится на аббревиатуру языка в каждой из копий технологии. Например, таргет `?.js` заменяется на `search.js`, если нода — `pages/search`. Такой подход удобен, когда мы настраиваем несколько нод через `nodeMask`.
* Make-файл — файл, в котором конфигурируется ENB для сборки проекта. Находится в папке `<project_root>/.enb/make.js`.
* Билдить — собирать, компилировать (используется в отношении таргетов).

Процесс сборки
--------------

1. Какие таргеты необходимо билдить `ENB` узнаёт из команды `enb make [target]`. Если вы запустили `enb make` без указания конкретного таргета, `ENB` будет собирать все таргеты, определенные в `make.js`.
2. `ENB` инициализирует ноды, участвующие в сборке указанных таргетов. В это время каждая нода спрашивает у технологий (которые регистрировались внутри ноды) список таргетов.
3. Запускаются технологии, которые отвечают за те таргеты, которые необходимо билдить.
4. В процессе выполнения технология может потребовать у ноды другие таргеты, необходимые для сборки (с помощью метода `requireSources`). В таком случае технология приостанавливается, нода запускает технологии, отвечающие за требуемые таргеты (если они не запущены) и после того, как технологии заканчивают сборку нужных таргетов, продолжает свою работу искомая технология.
5. После того, как технология выполнила свою работу по сборке таргета, она оповещает об этом ноду (с помощью метода `resolveTarget`).
6. Сборка завершается после того, как все необходимые таргеты собраны.

Как собрать проект - пошаговое руководство
==========================================

1. Прописать в `package.json` проекта зависимость от пакета `enb` (желательно в виде ">=последняя_версия").
2. Выполнить `npm install`.
3. Проверить, что `ENB` установлен. Команда `node_modules/.bin/enb` должна выполниться без ошибок.
4. Создать make-файл `.bem/enb-make.js` вида:

  ```javascript
  module.exports = function(config) {
  };
  ```
5. Проверить, что `ENB` работает. Команда `node_modules/.bin/enb make` должна выполниться без ошибок.
6. Теперь нужно настроить ноды. Для примера, я приведу вариант настройки ноды `pages/index`.

  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
      });
  };
  ```
  Так объявляется нода в рамках make-платформы. В данный момент она не настроена, а лишь объявлена.
7. Объявим таргеты, которые надо собрать для ноды:

  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
  };
  ```
  Таргеты объявлены, но при попытке выполнить `node_modules/.bin/enb make` будет ошибка, т.к. не зарегистрированы технологии, которые могут предоставить таргеты.
8. Зарегистрируем базовые технологии:
  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
        nodeConfig.addTechs([
          [ require('enb/techs/levels'), { levels: getLevels(config) } ],
          [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
          require('enb/techs/deps-old'),
          require('enb/techs/files')
        ]);

        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
  };

  function getLevels(config) {
      return [
        {path: 'bem-bl/blocks-common', check: false},
        {path: 'bem-bl/blocks-desktop', check: false},
        {path: 'lego/blocks-common', check: false},
        {path: 'lego/blocks-desktop', check: false},
        'common.blocks',
        'desktop.blocks'
      ].map(function(levelPath) { return config.resolvePath(levelPath); });
  }
  ```
  Чтобы не засорять конфиг ноды, функцию `getLevels` мы выносим в нижнюю часть файла.

  Рассмотрим каждую технологию:

  **enb/techs/levels** — собирает информацию об уровнях переопределения проекта. Результат выполнения этой технологии необходим технологиям `enb/techs/deps`, `enb/techs/deps-old` и `enb/techs/files`. Для каждой ноды по умолчанию добавляется уровень `<путь_к_ноде>/blocks`. Например, для ноды `pages/index` — `pages/index/blocks`.

  **enb/techs/file-provider** — сообщает make-платформе, что таргет (переданный в опции `target`) уже готов. В нашем случае, исходным файлом для сборки является `index.bemdecl.js`. Он лежит в репозитории и отдельная сборка для него не требуется.

  **enb/techs/deps-old** — собирает `?.deps.js` (`index.deps.js`) на основе `index.bemdecl.js` и `index.levels`. Почему `deps-old`? В lego не хватает ряда зависимостей, поэтому ваш проект может не собраться с более быстрый технологией `deps` без модификации lego. Технология `deps-old` повторяет алгоритм сборки из `bem-tools` и нехватка зависимостей становится незаметной, как раньше.

  **enb/techs/files** — собирает полный список файлов со всех уровней переопределения в том порядке, в котором они идут в финальном `index.deps.js`. Результат этой технологии может использоваться, например, в технологии `enb/techs/js`.

9. Регистрируем технологии, необходимые для сборки js и css.
  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
        nodeConfig.addTechs([
          [ require('enb/techs/levels'), { levels: getLevels(config) } ],
          [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
          require('enb/techs/deps-old'),
          require('enb/techs/files'),
          require('enb/techs/js'),
          require('enb/techs/css')
        ]);

        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
  };

  function getLevels(config) {
      return [
        {path: 'bem-bl/blocks-common', check: false},
        {path: 'bem-bl/blocks-desktop', check: false},
        {path: 'lego/blocks-common', check: false},
        {path: 'lego/blocks-desktop', check: false},
        'common.blocks',
        'desktop.blocks'
      ].map(function(levelPath) { return config.resolvePath(levelPath); });
  }
  ```
  Теперь файлы `index.js` и `index.css` могут собираться с помощью технологий `enb/techs/js` и `enb/techs/css` соответственно.
  Но мы регистрировали иные таргеты: `_?.js` (`_index.js`) и `_?.css` (`_index.css`). Для их сборки воспользуемся технологией `enb/techs/file-copy`.
  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
        nodeConfig.addTechs([
          [ require('enb/techs/levels'), { levels: getLevels(config) } ],
          [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
          require('enb/techs/deps-old'),
          require('enb/techs/files'),
          require('enb/techs/js'),
          require('enb/techs/css'),
          [ require('enb/techs/file-copy'), { sourceTarget: '?.js', destTarget: '_?.js' } ],
          [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '_?.css' } ]
        ]);

        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
  };

  function getLevels(config) {
      return [
        {path: 'bem-bl/blocks-common', check: false},
        {path: 'bem-bl/blocks-desktop', check: false},
        {path: 'lego/blocks-common', check: false},
        {path: 'lego/blocks-desktop', check: false},
        'common.blocks',
        'desktop.blocks'
      ].map(function(levelPath) { return config.resolvePath(levelPath); });
  }
  ```
  Теперь можно выполнить команду `node_modules/.bin/enb make` и в папке `pages/index` будут столь нужные нам `_index.js` и `_index.css`.
  Окей, мы получили результат, с которым можно работать. Но как же production-режим?

10. Разделяем сборку финальных файлов для разных режимов.
  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
        nodeConfig.addTechs([
          [ require('enb/techs/levels'), { levels: getLevels(config) } ],
          [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
          require('enb/techs/deps-old'),
          require('enb/techs/files'),
          require('enb/techs/js'),
          require('enb/techs/css')
        ]);

        nodeConfig.mode('development', function(nodeConfig) {
          nodeConfig.addTechs([
            [ require('enb/techs/file-copy'), { sourceTarget: '?.js', destTarget: '_?.js' } ],
            [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '_?.css' } ]
          ]);
        });

        nodeConfig.mode('production', function(nodeConfig) {
          nodeConfig.addTechs([
            [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.js', destTarget: '_?.js', minify: true } ],
            [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.css', destTarget: '_?.css', minify: true } ]
          ]);
        });

        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
  };

  function getLevels(config) {
      return [
        {path: 'bem-bl/blocks-common', check: false},
        {path: 'bem-bl/blocks-desktop', check: false},
        {path: 'lego/blocks-common', check: false},
        {path: 'lego/blocks-desktop', check: false},
        'common.blocks',
        'desktop.blocks'
      ].map(function(levelPath) { return config.resolvePath(levelPath); });
  }
  ```
  Теперь для production-режима конечные файлы обрабатываются [Борщиком](https://github.com/bem/borschik). Production-режим запускается командой `YENV=production node_modules/.bin/enb make`

11. Сборка `js` и `css` работает. Если в вашем проекте присутствуют другие цели или мультиязычность, то можно продолжить чтение данной документации в поисках информации о небходимых технологиях.
12. Собираем `node_modules/.bin/enb make`.

Настройка сборки
================

```javascript
module.exports = function(config) {

  // Языки для проекта.
  config.setLanguages(['ru', 'en']);

  // Добавление набора нод в сборку.
  config.nodes('pages/*');

  // Добавление ноды в сборку + конфигурирование ноды.
  config.node('pages/index', function(nodeConfig) {
    // Переопределение языков для конкретной ноды.
    nodeConfig.setLanguages(['ru']);

    // Добавление одной технологии с опциями.
    nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);

    // Добавление нескольких технологий.
    nodeConfig.addTechs([
      [ require('enb/techs/levels'), {
        levels: [
          'common.blocks',
          'desktop.blocks'
        ].map(function(config) { return config.resolvePath(level); }) // Резолвинг путей от корня проекта.
      }],
      require('enb/techs/deps'),
      require('enb/techs/files'),

      // Добавление технологии с опциями
      [ require('enb/techs/js'), { target: '?.new.js' } ],
      require('enb/techs/css')
    ]);

    // Добавление одного таргета.
    nodeConfig.addTarget('?.css');

    // Добавление нескольких таргетов.
    nodeConfig.addTargets(['?.css', '?.js']);
  });

  // Настройки для режима development.
  config.mode('development', function() {
    // Настройка нод по маске (regex).
    config.nodeMask(/pages\/.*/, function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '_?.css'} ],
        [ require('enb/techs/file-copy'), { sourceTarget: '?.js', destTarget: '_?.js'} ]
      ]);
    });
  });

  // Настройки для режима production.
  config.mode('production', function() {
    // Настройка нод по маске (regex).
    config.nodeMask(/pages\/.*/, function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/borschik'), { sourceTarget: '?.css', destTarget: '_?.css'} ],
        [ require('enb/techs/borschik'), { sourceTarget: '?.js', destTarget: '_?.js'} ]
      ]);
    });
  });

  // Регистрация таска.
  config.task('i18n.get', function(task) {
    // Выполнение shell-команды.
    return task.shell('./blocks/lego/tools/get-tanker.js');
  });

  // Установка переменных среды для shell-команд.
  config.setEnv({
      PRJ_ROOT        : config.resolvePath(), // Получение абсолютного пути к папке с проектом.
      TANKER_HOST     : 'tanker-test.yandex-team.ru',
      TANKER_PRJ      : 'super-project',
      TANKER_PRJ_REV  : 'master'
  });
};
```

Автоматизация с помощью express
===============================

При разработке `nodejs`-приложений на базе `express` можно сильно упростить использование `enb` в `development`-режиме.

Суть в том, что можно забыть о пересборке проекта, о других портах для статики и т.п. Можно просто отправлять в `ENB`
запросы на сборку тогда, когда это необходимо. То есть, когда вы открываете в браузере свой проект.

Для этого можно воспользоваться `express`-совместимым `middleware`. Его
возвращает модуль `enb/lib/server/middleware/enb`.

```javascript
/**
 * @param {Object} options
 * @param {String} [options.root=process.cwd()] - Корневая директория проекта.
 * @param {String} [options.mode='development'] - Режим сборки
 * @param {Boolean} [options.log=true] - Логгировать в консоль процесс сборки.
 * @returns {Function}
 */
module.exports = function(options) { /* ... */ };
```

Пример использования:

```javascript
app
    .use(require('enb/lib/server/middleware/enb')({
        root: '/path/to/root',
        log: false
    }))
    .get('/', function (req, res) {
        /* ... */
    });
```

Подробное описание актуальных технологий
========================================

В алфавитном порядке.

Все технологии, включенные в пакет `ENB`, находятся в папке `techs` пакета. Подключаются из make-файла с помощью `require('enb/techs/<tech-name>')`. Например, `require('enb/techs/js')`. Подключаются к ноде указанием класса и опций: `nodeConfig.addTech([ require('enb/techs/<tech-name>'), {/* [options] */} ]);`, либо без опций: `nodeConfig.addTech(require('enb/techs/<tech-name>'));`.

Если при настройке технологии в опциях указана подстрока `{lang}`, то будет создано столько копий технологии, сколько языков установлено для ноды или проекта (если у ноды не указаны языки).

Например:

```javascript
nodeConfig.setLanguages(['ru', 'en', 'tk']);
nodeConfig.addTech([require('js-i18n'), { target: '?.{lang}.js', lang: '{lang}' }]);
```

Эквивалентно:

```javascript
nodeConfig.addTech([require('js-i18n'), { target: '?.ru.js', lang: 'ru' }]);
nodeConfig.addTech([require('js-i18n'), { target: '?.en.js', lang: 'en' }]);
nodeConfig.addTech([require('js-i18n'), { target: '?.tk.js', lang: 'tk' }]);
```

file-copy
---------

Копирует один таргет в другой.
Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.

**Опции**

* *String* **sourceTarget** — Исходный таргет. Обязательная опция.
* *String* **destTarget** — Результирующий таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-copy'), {
  sourceTarget: '?.css',
  destTarget: '_?.css'
} ]);
```

file-merge
----------

Склеивает набор файлов в один.

**Опции**

* *String[]* **sources** — Список исходных таргетов. Обязательная опция.
* *String* **target** — Результирующий таргет. Обязательная опция.
* *String* **divider** — Строка для склеивания файлов. По умолчанию — "\n".
* *Boolean* **sourcemap** — Построение карт кода (source maps) с информацией об исходных файлах.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-merge'), {
    sources: ['?.bemhtml', '?.pre.js']
    target: '?.js'
} ]);
```

file-provider
-------------

Предоставляет существующий файл для make-платформы.
Может, например, использоваться для предоставления исходного *bemdecl*-файла.

**Опции**

* *String* **target** — Таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);
```

symlink
-------

Создает симлинк из одного таргета в другой. Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.

**Опции**

* *String* **fileTarget** — Исходный таргет. Обязательная опция.
* *String* **symlinkTarget** — Результирующий таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/symlink'), {
  fileTarget: '?.css',
  symlinkTarget: '_?.css'
} ]);
```

## Как написать свою технологию

С версии 0.8 технологии рекомендуется писать с использованием хэлпера `BuildFlow`.

Исходный код хэлпера: https://github.com/enb/enb/blob/master/lib/build-flow.js

В данном руководстве охвачены не все возможности `BuildFlow`. Полный перечень методов с описанием находится
в JSDoc файла `build-flow.js`.

### Теория

Цель технологии — собирать таргет в ноде. Например, технология `css` может собрать `index.css` в ноде `pages/index`
на основе `css`-файлов по уровням переопределения.

Каждая технология умеет принимать настройки.
Хэлпер `BuildFlow` способствует тому, чтобы максимальное количество параметров было настраиваемым.

Технологии могут использовать результат выполнения других технологий. Например, список исходных `css`-файлов
строится с помощью технологии `files`.

В общем случае, технологии создавать несложно. Бывают необычные ситуации.
В этом руководстве я постараюсь охватить и такие случаи.

### Технология для склеивания файлов по суффиксу

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

### Технология для склеивания нескольких целей

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

### Зависимости от файлов, не входящих в сборку

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

## Node API

Каждой технологии в `init` приходит инстанция ноды, для которой необходимо собирать таргеты.
Через ноду технология взаимодействует с процессом сборки.

Основные методы класса Node:

node.getTargetName
------------------

```javascript
// Возвращает имя таргета ноды без суффикса. Например, для ноды 'pages/index' результат — index.
String Node::getTargetName()
// Возвращает имя таргета ноды с суффиксом. Например, для ноды 'pages/index' с суффиксом 'js' результат — 'index.js'.
String Node::getTargetName(String suffix)
```

node.unmaskTargetName
---------------------

```javascript
// Демаскирует имя таргета ноды. Например, для ноды 'pages/index' и maskedTargetName='?.css', результат — 'index.css'.
String Node::unmaskTargetName(String maskedTargetName)
```

node.resolvePath
----------------

```javascript
// Возвращает абсолютный путь к таргету.
String Node::resolvePath(String targetName)
```

**Пример**

```javascript
var fs = require('fs');
fs.writeFileSync(this.node.resolvePath(this.node.getTargetName('js')), 'alert("Hello World!");', 'utf8');
```

node.resolveTarget
------------------

```javascript
// Оповещает ноду о том, что таргет собран. Опционально принимает результат сборки.
// Результатом может быть любой объект, который может быть полезен другим технологиям для продолжения сборки.
undefined Node::resolveTarget(String targetName[, Object result])
```

**Примеры**

```javascript
// #1
this.node.resolveTarget('index.css');

// #2 Получаем имя таргета динамически с помощью суффикса.
this.node.resolveTarget(this.node.getTargetName('css'));

// #3 Получаем имя таргета путем демаскирования таргета.
this.node.resolveTarget(this.node.unmaskTargetName('?.css'));

// #4 Передаем значение.
var target = this.node.unmaskTargetName('?.deps.js'),
    targetPath = this.node.resolvePath(target);
delete require.cache[targetPath]; // Избавляемся от кэширования в nodejs.
this.node.resolveTarget(target, require(targetPath));
```

node.rejectTarget
------------------

```javascript
// Оповещает ноду о том, что таргет не может быть собран из-за ошибки.
undefined Node::rejectTarget(String targetName, Error error)
```

**Примеры**

```javascript
// #1
this.node.rejectTarget('index.css', new Error('Could not find CSS Tools.'));

// #2 Получаем имя таргета динамически с помощью суффикса.
this.node.rejectTarget(this.node.getTargetName('css'), new Error('Could not find CSS Tools.'));
```

node.requireSources
-------------------

```javascript
// Требует у ноды таргеты для дальнейшей сборки, возвращает промис.
// Промис выполняется, возвращая массив результатов, которыми резолвились требуемые таргеты.
// ВАЖНО: Не все технологии резолвят таргеты с результатом.
// В данный момент резолвят с результатом технологии: levels, deps*, files.
Promise(Object[]) Node::requireSources(String[] targetNames)
```

**Пример**

Например, нам надо объединить в один файл `index.css` и `index.ie.css` и записать в `index.all.css`.

```javascript
var vowFs = require('vow-fs');
// ...
  build: function() {
    var _this = this;
    return this.node.requireSources(['index.css', 'index.ie.css']).then(function() {
      return Vow.all([vowFs.read(_this.node.resolvePath('index.css'), 'utf8'), vowFs.read(_this.node.resolvePath('index.ie.css'), 'utf8')]).then(function(res) {
        return vowFs.write(_this.node.resolvePath('index.all.css'), res.join('\n'), 'utf8').then(function() {
          _this.node.resolveTarget('index.all.css');
        });
      });
    });
  }
// ...
```

node.relativePath
-----------------

```javascript
// Возвращает относительный путь к таргету относительно ноды.
String Node::relativePath(String targetName)
```

node.getDir
-----------

```javascript
// Возвращает полный путь к папке ноды.
String Node::getDir()
```

node.getRootDir
---------------

```javascript
// Возвращает полный путь к корневой папке проекта.
String Node::getRootDir()
```

node.getLogger
--------------

[Logger](/mdevils/enb/blob/master/lib/logger.js)

```javascript
// Возвращает инстанцию логгера для ноды.
Logger Node::getLogger()
```

**Пример**

```javascript
this.node.getLogger().log('Hello World');
```

node.getNodeCache
-----------------

[Cache](/mdevils/enb/blob/master/lib/cache/cache.js)

```javascript
// Возвращает инстанцию кэша для таргета ноды.
Cache Node::getNodeCache(String targetName)
```

Кэширование необходимо для того, чтобы избегать повторной сборки файлов, для которых сборка не требуется. Кэшируется время изменения исходных и конечных файлов после окончания сборки каждой технологии. Логика кэширования реализуется в каждой технологии индивидуально для максимальной гибкости.

С помощью методов `Boolean needRebuildFile(String cacheKey, String filePath)` и `Boolean needRebuildFileList(String cacheKey, FileInfo[] files)` производится валидация кэша.

С помощью методов `undefined cacheFileInfo(String cacheKey, String filePath)` и `undefined cacheFileList(String cacheKey, FileInfo[] files)` производится сохранение информации о файлах в кэш.


node.getSharedResources
-----------------------

[SharedResources](lib/shared-resources/index.js)

Набор ресурсов, которые могут быть использованы в технологиях:
- [JobQueue](lib/shared-resources/job-queue/index.js) - пул дочерних процессов для выполнения "тяжелых" задач

**Пример**

Контент файла `some-processor.js`:
```js
module.exports = function(arg1, arg2) {
    var res = null;
    // Здесь какая-то нагруженная работа, возможно с использованием промисов
    return res;
}
```
В технологии:
```js
var jobQueue = this.node.getSharedResources().jobQueue;
// Выполнить таску в отдельном процессе, возвращается промис с результатом
return jobQueue.push(require.resolve('./path/to/processor'), arg1, arg2);
```
