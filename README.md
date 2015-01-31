ENB [![Build Status](https://travis-ci.org/enb-make/enb.svg?branch=master)](https://travis-ci.org/enb-make/enb) [![Coverage Status](https://img.shields.io/coveralls/enb-make/enb.svg?branch=master)](https://coveralls.io/r/enb-make/enb)
===

Сборщик проектов. С помощью ENB можно собрать любой проект, который строится на модели node / target.

**ВАЖНО:** Конфигуратор для упрощения создания конфига: [http://enb-make.info/config/](http://enb-make.info/config/).

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

* Сборка BEMHTML: https://github.com/enb-make/enb-bemhtml
* Модульность для нового bem-core: https://github.com/enb-make/enb-modules
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
* Андрею Абрамову (@andrewblond). За пулл-реквесты.

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
4.
  Создать make-файл `.bem/enb-make.js` вида:

  ```javascript
  module.exports = function(config) {
  };
  ```
5. Проверить, что `ENB` работает. Команда `node_modules/.bin/enb make` должна выполниться без ошибок.
6.
  Теперь нужно настроить ноды. Для примера, я приведу вариант настройки ноды `pages/index`.

  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
      });
  };
  ```
  Так объявляется нода в рамках make-платформы. В данный момент она не настроена, а лишь объявлена.
7.
  Объявим таргеты, которые надо собрать для ноды:

  ```javascript
  module.exports = function(config) {
      config.node('pages/index', function(nodeConfig) {
        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
  };
  ```
  Таргеты объявлены, но при попытке выполнить `node_modules/.bin/enb make` будет ошибка, т.к. не зарегистрированы технологии, которые могут предоставить таргеты.
8.
  Зарегистрируем базовые технологии:
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

9.
  Регистрируем технологии, необходимые для сборки js и css.
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

10.
  Разделяем сборку финальных файлов для разных режимов.
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
            [ require('enb/techs/borschik'), { sourceTarget: '?.js', destTarget: '_?.js', minify: true } ],
            [ require('enb/techs/borschik'), { sourceTarget: '?.css', destTarget: '_?.css', minify: true } ]
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

Для этого можно воспользоваться `express`-совместимым `middleware`. Его возвращает метод `createMiddleware` модуля
`lib/server/server-middleware`.

```javascript
/**
 * @param {Object} options
 * @param {String} options.cdir Корневая директория проекта.
 * @param {Boolean} options.noLog Не логгировать в консоль процесс сборки.
 * @returns {Function}
 */
module.exports.createMiddleware = function(options) { /* ... */ };
```

Пример использования:

```javascript
app
    .use(require('enb/lib/server/server-middleware').createMiddleware())
    .get('/', function (req, res) {
        /* ... */
    });
```

Сборка по требованию
====================

Помимо упрощения сборки статики в `dev`-режиме с помощью `ENB` в `express`-приложениях,
можно собирать по требованию различные ресурсы, например, шаблоны.

Если `nodejs` приложению в процессе работы требуется собирать шаблоны или локализацию (или что-нибудь еще),
то можно воспользоваться методом `createBuilder` модуля `lib/server/server-middleware`.

```javascript
/**
 * @param {Object} options
 * @param {String} options.cdir Корневая директория проекта.
 * @param {Boolean} options.noLog Не логгировать в консоль процесс сборки.
 * @returns {Function}
 */
module.exports.createBuilder = function(options) { /* ... */ };
```

Пример использования:

```javascript
var enbBuilder = require('enb/lib/server/server-middleware').createBuilder();
var dropRequireCache = require('enb/lib/fs/drop-require-cache');
app
    .get('/', function (req, res, next) {
        var bemhtmlFilePath = 'pages/index/index.bemhtml.js';
        enbBuilder(bemhtmlFilePath).then(function() {
            var bemhtmlAbsFilePath = process.process.cwd() + '/' + bemhtmlFilePath;
            dropRequireCache(require, bemhtmlAbsFilePath);
            var bemhtml = require(bemhtmlAbsFilePath);
            res.end(bemhtml.BEMHTML.apply({block: 'b-page', content: 'Hello World'}));
            next();
        }, next);
    });
```

Сборка merged (common) бандла
-----------------------------

>  Merged бандл — это бандл, который объединяет в себе декларации всех бандлов уровня. Соответственно по такой объединенной декларации собираются и объединенные конечные файлы. Например, css будет включать в себе все стили, используемые всеми бандлами.
>
>  Merged бандл может быть полезен, например, если вы хотите использовать общие файлы статики (js, css) для нескольких страниц проекта.
>  (c) bem.info

Одним из решений может быть:

1. Проход по всем нодам и копирование deps в общую (`common`) папку (см. `deps-provider`);

2. Мердж всех депсов в один (см. `deps-merge`).

Разберем на примере:

Предположим, есть 3 ноды:

* `pages/index`
* `pages/search`
* `pages/order`

У каждой страницы свои уникальными стили и скрипты. Нам нужно собрать общий `js` и `css` с этих страниц и положить их внутрь `pages/common/` как `common.js` и `common.css` соответственно.


```javascript
// Пробегаемся по всем директориям внутри "pages"
// ...
config.nodeMask(/pages\/.*/, function (nodeConfig) {
    // Если текущая нода common
    if (nodeConfig.getPath() === 'pages/common') {
        nodeConfig.addTechs([
            [ require("enb/techs/levels"), { levels: getLevels() } ],
            require("enb/techs/files"),

            // Копируем депсы с каждоый страницы внутрь текущей ноды (pages/common)
            [ require('enb/techs/deps-provider'), { sourceNodePath: 'pages/index', depsTarget: 'index.deps.js' } ],
            [ require('enb/techs/deps-provider'), { sourceNodePath: 'pages/search', depsTarget: 'search.deps.js' } ],
            [ require('enb/techs/deps-provider'), { sourceNodePath: 'pages/order', depsTarget: 'order.deps.js' } ],

            // Склеиваем наши депсы в один (common.deps.js)
            [ require('enb/techs/deps-merge'), { depsSources: ['index.deps.js', 'search.deps.js', 'order.deps.js'] } ],

            require("enb/techs/js"),
            require("enb/techs/css"),
            [ require("enb/techs/css"), {target: '?.ie9.css', sourceSuffixes: ['css', 'ie9.css'] } ]
        ]);
        // Собираем необходимые файлы
        nodeConfig.addTargets(["_?.js", "_?.css", "_?.ie9.css"]);
    } else {
        nodeConfig.addTechs([
            [ require("enb/techs/levels"), { levels: getLevels() } ],
            [ require("enb/techs/file-provider"), { target: "?.bemjson.js" } ],
            require("enb/techs/bemdecl-from-bemjson"),
            require("enb/techs/deps-old"),
            require("enb/techs/files"),
            require("enb-bemhtml/techs/bemhtml"),
            require("enb/techs/html-from-bemjson"),
            require("enb/techs/js"),
            [ require("enb/techs/i18n-merge-keysets"), { lang: "all" }],
            [ require("enb/techs/i18n-merge-keysets"), { lang: "{lang}" }],
            [ require("enb/techs/i18n-lang-js"), { lang: "all" } ],
            [ require("enb/techs/i18n-lang-js"), { lang: "{lang}" } ],
            [ require("enb/techs/js-i18n"), { lang: "{lang}" } ],
            require("enb/techs/css"),
            [ require("enb/techs/css"), {target: '?.ie9.css', sourceSuffixes: ['css', 'ie9.css'] } ]
        ]);
        nodeConfig.addTargets(["_?.js", "_?.css", "_?.ie9.css", "?.html"]);
    }

    function getLevels() {
        return [
            {"path":"bem-bl/blocks-common","check":false},
            {"path":"bem-bl/blocks-touch","check":false},
            {"path":"blocks","check":true}
        ].map(function(l) { return config.resolvePath(l); });
    }
});
// ...
```

Обратите внимание, директория `pages/common` должна сущестовать. Её можно создавать динамически.
```javascript
// ...
  // Создание директории common
  if (!fs.existsSync('pages/common')) {
      fs.mkdirSync('pages/common');
  }
// ...
```

Конечно, если у вас много страниц и постоянно добавляются новые, то лучше обрабатывать это динамически:

Необходимо подключать модуль `fs`
```javascript
var fs = require('fs');
//...
if (nodeConfig.getPath() === 'touch.bundles/common') {
    var pagesDeps = [],
        addTechsAttrs = [
            [ require("enb/techs/levels"), { levels: getLevels() } ],
            require("enb/techs/files"),
            require("enb/techs/js"),
            require("enb/techs/css"),
            require("enb/techs/css-ie9")
        ];

    // Проходимся по существующим страницам
    fs.readdirSync('touch.bundles').map(function (page) {
        if (page !== 'common') {
            // Копируем депсы с каджой страницы внутрь common
            addTechsAttrs.push([ require('enb/techs/deps-provider'), { sourceNodePath: 'touch.bundles/' + page, depsTarget: page + '.deps.js' } ]);

            pagesDeps.push(page + '.deps.js');
        }
    });

    // Мерджим все полученные депмы в один - common.deps.js
    addTechsAttrs.push([ require('enb/techs/deps-merge'), { depsSources: pagesDeps } ]);

    // прокидываем атрибуты
    nodeConfig.addTechs(addTechsAttrs);
    nodeConfig.addTargets(["_?.js", "_?.css", "_?.ie9.css"]);
}
//...
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

bemdecl-from-bemjson
--------------------

Формирует *bemdecl* на основе `?.bemjson.js`.

**Опции**

* *String* **sourceTarget** — Исходный bemjson-таргет. По умолчанию — `?.bemjson.js`.
* *String* **destTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/bemdecl-from-bemjson'));
```

bemdecl-from-deps-by-tech
-------------------------

Формирует *bemdecl* на основе depsByTech-информации из `?.deps.js`.

**Опции**

* *String* **sourceTech** — Имя исходной технологии. Обязательная опция.
* *String* **destTech** — Имя конечной технологии. Обязательная опция.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'deps.js'`.
* *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/bemdecl-from-deps-by-tech'), {
    sourceTech: 'js',
    destTech: 'bemhtml'
});
```

bemdecl-merge
-------------

Формирует *bemdecl* с помощью объединения других bemdecl-файлов.

**Опции**

* *String[]* **bemdeclSources** — Исходные bemdecl-таргеты. Обязательная опция.
* *String* **bemdeclTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/bemdecl-merge'), {
  bemdeclSources: ['search.bemdecl.js', 'router.bemdecl.js'],
  bemdeclTarget: 'all.bemdecl.js'
} ]);
```

bemdecl-provider
----------------

Копирует *bemdecl* в текущую ноду под нужным именем из другой ноды. Может понадобиться, например, для объединения bemdecl'ов.

**Опции**

* *String* **sourceNodePath** — Путь исходной ноды с нужным bemdecl'ом. Обязательная опция.
* *String* **sourceTarget** — Исходный bemdecl, который будет копироваться. По умолчанию — `?.bemdecl.js` (демаскируется в рамках исходной ноды).
* *String* **bemdeclTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js` (демаскируется в рамках текущей ноды).

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/bemdecl-provider'), {
  sourceNodePath: 'bundles/router',
  sourceTarget: 'router.bemdecl.js',
  bemdeclTarget: 'router.bemdecl.js'
}]);
```

borschik
--------

Технология переехала в пакет `enb-borschik`.

browser-js
----------

Технология переехала в пакет `enb-diverse-js`.

css
---

Склеивает *css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'css'`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css'));
```

css-borschik-chunks
-------------------

Технология переехала в пакет `enb-borschik`.


css-chunks
----------

Технология переехала в пакет `enb-bembundle`.

css-ie
------

Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.

css-ie6
-------

Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.

css-ie7
-------

Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.

css-ie8
-------

Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.

css-ie9
-------

Технология устарела. Используйте технологию `css` с опцией `sourceSuffixes`.

css-ie-includes
---------------

Технология устарела. Используйте технологию `css-includes` с опцией `sourceSuffixes`.

css-includes
------------

Собирает *css*-файлы по deps'ам инклудами, сохраняет в виде `?.css`. Может пригодиться в паре с ycssjs (как fastcgi-модуль).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'css'`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-includes'));
```

css-less
--------

Технология устарела и будет удалена.

css-stylus
----------

Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список
  исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `['css', 'styl']`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-stylus'));
```

css-stylus-with-nib
-------------------

Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
При сборке *styl*-файлов использует [`nib`](https://github.com/visionmedia/nib).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список
  исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `['css', 'styl']`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-stylus-with-nib'));
```

deps
----

Быстро собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости.
Сохраняет в виде `?.deps.js`.
Следует использовать с осторожностью: в lego не хватает зависимостей,
потому проект может собраться иначе, чем с помощью bem-tools.

Имя *levels*-таргета в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **bemdeclTarget** — Исходный bemdecl. По умолчанию — `?.bemdecl.js`.
* *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
* *String* **depsTarget** — Результирующий deps. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(require('enb/techs/deps'));
```

Сборка специфического deps:
```javascript
nodeConfig.addTech([ require('enb/techs/deps'), {
  bemdeclTarget: 'search.bemdecl.js',
  depsTarget: 'search.deps.js'
} ]);
```

deps-merge
-------------

Формирует *deps* с помощью объединения других deps-файлов.

**Опции**

* *String[]* **depsSources** — Исходные deps-таргеты. Обязательная опция.
* *String* **depsTarget** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/deps-merge'), {
  depsSources: ['search.deps.js', 'router.deps.js'],
  depsTarget: 'all.deps.js'
} ]);
```

deps-old
--------

Собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости.
Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.

Имя *levels*-таргета в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **bemdeclTarget** — Исходный bemdecl. По умолчанию — `?.bemdecl.js`.
* *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
* *String* **depsTarget** — Результирующий deps. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(require('enb/techs/deps-old'));
```

Сборка специфического deps:
```javascript
nodeConfig.addTech([ require('enb/techs/deps-old'), {
  bemdeclTarget: 'search.bemdecl.js',
  depsTarget: 'search.deps.js'
} ]);
```

deps-provider
-------------

Копирует *deps* в текущую ноду под нужным именем из другой ноды.
Может понадобиться, например, для объединения deps'ов.

**Опции**

* *String* **sourceNodePath** — Путь исходной ноды с нужным deps'ом. Обязательная опция.
* *String* **sourceTarget** — Исходный deps, который будет копироваться. По умолчанию — `?.deps.js` (демаскируется в рамках исходной ноды).
* *String* **depsTarget** — Результирующий deps-таргет. По умолчанию — `?.deps.js` (демаскируется в рамках текущей ноды).

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/deps-provider'), {
  sourceNodePath: 'bundles/router',
  sourceTarget: 'router.deps.js',
  depsTarget: 'router.deps.js'
} ]);
```

deps-subtract
-------------

Формирует *deps* с помощью вычитания одного deps-файла из другого.
Может применяться в паре с `deps-provider` для получения deps для bembundle.

**Опции**

* *String* **subtractFromTarget** — Таргет, из которого вычитать. Обязательная опция.
* *String* **subtractWhatTarget** — Таргет, который вычитать. Обязательная опция.
* *String* **depsTarget** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('enb/techs/deps'), { depsTarget: 'router.tmp.deps.js' } ],
  [ require('enb/techs/deps-provider'), { sourceNodePath: 'pages/index', depsTarget: 'index.deps.js' }],
  [ require('enb/techs/deps-subtract'), {
    subtractWhatTarget: 'index.deps.js',
    subtractFromTarget: 'router.tmp.deps.js',
    depsTarget: 'router.deps.js'
  } ]
]);
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

files
-----

Собирает список исходных файлов для сборки на основе *deps* и *levels*, предоставляет `?.files` и `?.dirs`.
Используется многими технологиями, которые объединяют множество файлов из различных уровней переопределения в один.

**Опции**

* *String* **depsTarget** — Исходный deps-таргет. По умолчанию — `?.deps.js`.
* *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
* *String* **filesTarget** — Результирующий files-таргет. По умолчанию — `?.files`.
* *String* **dirsTarget** — Результирующий dirs-таргет. По умолчанию — `?.dirs`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/files'));
```

html-from-bemjson
-----------------

Технология устарела. Используйте технологию из пакета вашего шаблонизатора: `enb-xjst`, `enb-bemxjst`, `enb-bh`.

html-from-bemjson-i18n
----------------------

Технология устарела. Используйте технологию из пакета вашего шаблонизатора: `enb-xjst`, `enb-bemxjst`, `enb-bh`.

i18n-keysets-xml
----------------

Собирает `?.keysets.<язык>.xml`-файлы на основе `?.keysets.<язык>.js`-файлов.

Используется для локализации xml-страниц, работающих в XScript (насколько я понимаю).

Исходные и конечные таргеты в данный момент не настраиваются (нет запроса).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTech([ require('i18n-keysets-xml'), { lang: '{lang}' } ]);
```

i18n-lang-js
------------

Собирает `?.lang.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файлов.

Используется для локализации в JS с помощью BEM.I18N.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.lang.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.
* *String* **keysetsTarget** — Исходный таргет. По умолчанию — `?.keysets.{lang}.js`.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('i18n-lang-js'), { lang: 'all'} ],
  [ require('i18n-lang-js'), { lang: '{lang}'} ],
]);
```

i18n-lang-js-chunks
-------------------

Собирает `?.js-chunks.lang.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файлов.

Используется для локализации в JS с помощью BEM.I18N при сборке bembundle.

Исходные и конечные таргеты в данный момент не настраиваются (нет запроса).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.js-chunks.lang.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('i18n-lang-js-chunks'), { lang: 'all' } ],
  [ require('i18n-lang-js-chunks'), { lang: '{lang}' } ],
]);
```

i18n-merge-keysets
------------------

Собирает `?.keysets.<язык>.js`-файлы на основе `*.i18n`-папок для указанных языков.

Исходные и конечные таргеты в данный момент не настраиваются (нет запроса).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('i18n-merge-keysets'), { lang: 'all' } ],
  [ require('i18n-merge-keysets'), { lang: '{lang}' } ]
]);
```

js
--

Склеивает *js*-файлы по deps'ам, сохраняет в виде `?.js`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.js`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'js'`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/js'));
```

js-bundle-component
-------------------

Технология переехала в пакет `enb-bembundle`.

js-bembundle-component-i18n
---------------------------

Технология переехала в пакет `enb-bembundle`.

js-bundle-page
--------------

Технология переехала в пакет `enb-bembundle`.

js-bembundle-page-i18n
----------------------

Технология переехала в пакет `enb-bembundle`.

js-chunks
---------

Технология переехала в пакет `enb-bembundle`.

js-expand-includes
------------------

Обрабатывает инклуды в исходном `js`-файле и собирает результирующий файл. При раскрытии инклудов, если имя подключенного файла является таргетом, то ждет его выполнения.

**Опции**

* *String* **sourceTarget** — Исходный JS-таргет. Обязательная опция.
* *String* **destTarget** — Результирующий JS-таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/js-expand-includes'), { sourceTarget: '?.run-tests.js', destTarget: '_?.run-tests.js' } ]);
```

js-i18n
-------

Собирает `js`-файл по deps'ам и добавляет в результат таргет `?.lang.<язык>.js`. Используется с технологией `i18n-lang-js`.

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'js'`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/js-i18n'), { lang: '{lang}' } ]);
```

js-includes
-----------

Собирает *js*-файлы по deps'ам инклудами, сохраняет в виде `?.js`. Может пригодиться в паре с ycssjs (как fastcgi-модуль).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `'js'`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/js-includes'));
```

levels
------

Собирает информацию об уровнях переопределения проекта, предоставляет `?.levels`. Результат выполнения этой технологии необходим технологиям `enb/techs/deps`, `enb/techs/deps-old` и `enb/techs/files`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.levels`.
* *(String|Object)[]* **levels** — Уровни переопределения. Полные пути к папкам с уровнями переопределения. Вместо строки с уровнем может использоваться объект вида `{path: '/home/user/www/proj/lego/blocks-desktop', check: false}` для того, чтобы закэшировать содержимое тех уровней переопределения, которые не модифицируются в рамках проекта.
* *(String)[]* **sublevelDirectories** — Список директорий ноды с уровнями переопределения. По умолчанию — для каждой ноды добавляется уровень `<путь_к_ноде>/blocks`, например, для ноды `pages/index` — `pages/index/blocks`. Каждый следующий указаный уровень может переопределять предыдущий.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/levels'), {
  levels: [
    {path: 'lego/blocks-desktop', check: false},
    'desktop.blocks'
  ].map(function(level) { return config.resolvePath(level); })
} ]);
```

node-js
-------

Технология переехала в пакет `enb-diverse-js`.

priv-js
-------

Технология переехала в пакет `enb-priv-js`.

priv-js-i18n
------------

Технология переехала в пакет `enb-priv-js`.

priv-js-i18n-all
----------------

Технология переехала в пакет `enb-priv-js`.

pub-js-i18n
-----------

Технология переехала в пакет `enb-priv-js`.

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

vanilla-js
----------

Технология переехала в пакет `enb-diverse-js`.

xsl
---

Технология переехала в пакет `enb-lego-xml`.

xsl-2lego
---------

Технология переехала в пакет `enb-lego-xml`.

xsl-convert2xml
---------------

Технология переехала в пакет `enb-lego-xml`.

xsl-html5
---------

Технология переехала в пакет `enb-lego-xml`.

xsl-html5-i18n
--------------

Технология переехала в пакет `enb-lego-xml`.

xslt
----

Технология переехала в пакет `enb-lego-xml`.

## Как написать свою технологию

С версии 0.8 технологии рекомендуется писать с использованием хэлпера `BuildFlow`.

Исходный код хэлпера: https://github.com/enb-make/enb/blob/master/lib/build-flow.js

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

Пример использования: [Технология deps](/mdevils/enb/blob/master/techs/deps.js#L31)

node.relativePath
-----------------

```javascript
// Возвращает относительный путь к таргету относительно ноды.
String Node::relativePath(String targetName)
```

Пример использования: [Технология css-includes](/mdevils/enb/blob/master/techs/css-includes.js#L16)

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

Пример использования: [Технология deps](/mdevils/enb/blob/master/techs/deps.js#L79)

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

Пример использования:

* Валидация кэша: [Технология deps](/mdevils/enb/blob/master/techs/deps.js#L33)
* Кэширование результатов сборки: [Технология deps](/mdevils/enb/blob/master/techs/deps.js#L73)
