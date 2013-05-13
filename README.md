ENB
===

Инструментарий для работы с проектами, основанными на идеологии BEM.

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

* ENB (как платформа) свободна от идеологии BEM. С помощью нее можно собрать любой проект, который строится на модели node / target. Сбор префиксов не является частью платформы, а реализуется с помощью одной из технологий.
* Технологии в ENB не ограничены в том, каким образом они будут собирать те или иные таргеты.
* Все технологии настраиваемые (в большей или меньшей степени).
* ENB сложнее настроить для проекта. В нем нет готовых шаблонов make-файлов.
* В рамках ENB одна и та же технология может быть использована с разными опциями. Например, можно построить несколько разных `deps.js` в рамках одной ноды на основе различных `bemdecl.js`.

**Как потестить?**

Специально для этого я подготовил сборку project-stub на ENB: https://github.com/mdevils/project-stub

Благодарности
-------------

* Дмитрию Филатову (@dfilatov). За `vow`, `vow-fs`, `inherit`, советы, поддержку и мотивацию.
* Дмитрию Ковалю (@smith). За помощь в сборке тестов, production-режима и здоровый скептицизм.
* Александру Тармолову (@hevil). За помощь с `git`, `modules`, поддержку и полезные ссылки.
* Вениамину Клещенкову (@benjamin). За помощь в отладке и доработке ENB, поддержку, советы и ревью.
* Сергею Бережному (@veged). За `borschik`, советы и правильные вопросы.
* Команде разработчиков bem-tools. За часть заимствованного кода.

Содержание
----------

* [Терминология](#Терминология)
* [Процесс сборки](#Процесс-сборки)
* [Как собрать проект - пошаговое руководство](#Как-собрать-проект---пошаговое-руководство)
* [Настройка сборки](#Настройка-сборки)
* [Подробное описание актуальных технологий](#Подробное-описание-актуальных-технологий)
* [Как написать свою технологию](#Как-написать-свою-технологию)
* [Node API](#node-api)

Терминология
------------

* Target (таргет) — это цель для сборки. Например, таргетом может быть `index.js` в рамках ноды `pages/index`..
* Node (нода) — это папка, в которой находятся те или иные таргеты. Например, `pages/index`.
* Suffix (суффикс) — это расширение исходного или конечного файла. Например, `js`.
* Masked Target (замаскированный таргет) — это имя таргета, которое может содержать `?`. Знак `?` заменяется на имя ноды в процессе настройки технологии, а с помощью подстроки `{lang}` можно создать несколько копий технологии для каждого из языков, где `{lang}` заменится на аббревиатуру языка в каждой из копий технологии. Например, таргет `?.js` заменяется на `search.js`, если нода — `pages/search`. Такой подход удобен, когда мы настраиваем несколько нод через `nodeMask`.
* Make-файл — файл, в котором конфигурируется ENB для сборки проекта. Находится в папке `<project_root>/.bem/enb-make.js`.
* Билдить — собирать, компилировать (используется в отношении таргетов).

Процесс сборки
--------------

1. Определяется, какие таргеты необходимо билдить. Если мы запустили `enb make` без указания конкретного таргета, то используются все таргеты, определенные в make-файле.
2. Инициализируются ноды, участвующие в сборке указанных таргетов. В процессе инициализации каждая нода спрашивает у технологий (которые регистрировались в рамках ноды) список таргетов.
3. Запускаются технологии, которые отвечают за те таргеты, которые необходимо билдить.
4. В процессе выполнения технология может потребовать у ноды другие таргеты, необходимые для сборки (с помощью метода `requireSources`). В таком случае технология приостанавливается, нода запускает технологии, отвечающие за требуемые таргеты (если они не запущены) и после того, как технологии заканчивают сборку нужных таргетов, продолжает свою работу искомая технология.
5. После того, как технология выполнила свою работу по сборке таргета, она оповещает об этом ноду (с помощью метода `resolveTarget`).
6. Сборка завершается после того, как все необходимые таргеты собраны.

Как собрать проект - пошаговое руководство
==========================================

1. Прописать в package.json проекта зависимость от пакета enb (желательно в виде ">=последняя_версия").
2. Выполнить `npm install`.
3. Проверить, что ENB установлен. Команда `node_modules/.bin/enb` должна выполниться без ошибок.
4. 
  Создать make-файл `.bem/enb-make.js` вида:

  ```javascript
  module.exports = function(config) {
  };
  ```
5. Проверить, что ENB работает. Команда `node_modules/.bin/enb make` должна выполниться без ошибок.
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
          require('enb/techs/deps-old'))(),
          require('enb/techs/files'))(),
          require('enb/techs/js'))(),
          require('enb/techs/css'))(),
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
        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
      config.mode('development', function() {
        config.node('pages/index', function(nodeConfig) {
          nodeConfig.addTechs([
            [ require('enb/techs/file-copy'), { sourceTarget: '?.js', destTarget: '_?.js' } ],
            [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '_?.css' } ]
          ]);
        });
      });
      config.mode('production', function() {
        config.node('pages/index', function(nodeConfig) {
          nodeConfig.addTechs([
            [ require('enb/techs/borschik'), { sourceTarget: '?.js', destTarget: '_?.js', minify: true } ],
            [ require('enb/techs/borschik'), { sourceTarget: '?.css', destTarget: '_?.css', minify: true } ]
          ]);
        });
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
  Теперь для production-режима (который запускается командой `YENV=production node_modules/.bin/enb make`) конечные файлы обрабатываются Борщиком (https://github.com/veged/borschik).

11. Сборка js и css работает. Если в вашем проекте присутствуют другие цели или мультиязычность, то можно продолжить чтение данной документации в поисках информации о небходимых технологиях.
12. Собираем `node_modules/.bin/enb make`.

Настройка сборки
================

```javascript
module.exports = function(config) {

  // Языки для проекта.
  config.setLanguages(['ru', 'en']);

  // Добавление ноды в сборку.
  config.node('pages/index');

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


Подробное описание актуальных технологий
========================================

В алфавитном порядке.

Все технологии, включенные в пакет ENB, находятся в папке `techs` пакета. Подключаются из make-файла с помощью `require('enb/techs/<tech-name>')`. Например, `require('enb/techs/js')`. Подключаются к ноде указанием класса и опций: `nodeConfig.addTech([ require('enb/techs/<tech-name>'), {/* [options] */} ]);`, либо без опций: `nodeConfig.addTech(require('enb/techs/<tech-name>'));`.

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

bemhtml
-------

Склеивает *bemhtml*-файлы по deps'ам, обрабатывает BEMHTML-транслятором, сохраняет в виде `?.bemhtml.js`. Использует пакет `bemc` (https://github.com/bem/bemc).

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **exportName** — Имя переменной-обработчика BEMHTML. По умолчанию — `'BEMHTML'`.
* *Boolean* **devMode** — Development-режим. По умолчанию — `true`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/bemhtml'));
```

borschik
--------

Обрабатывает файл Борщиком (раскрытие borschik-ссылок, минификация, фризинг).

Настройки фризинга и путей описываются в конфиге Борщика (`.borschik`) в корне проекта (https://github.com/veged/borschik/blob/master/README.ru.md).

**Опции**

* *String* **sourceTarget** — Исходный таргет. Например, `?.js`. Обязательная опция.
* *String* **destTarget** — Результирующий таргет. Например, `_?.js`. Обязательная опция.
* *Boolean* **minify** — Минифицировать ли в процессе обработки. По умолчанию — `true`.
* *Boolean* **freeze** — Использовать ли фризинг в процессе обработки. По умолчанию — `false`.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/borschik'), {
  sourceTarget: '?.css',
  destTarget: '_?.css',
  minify: true,
  freeze: true
} ]);
```

css
---

Склеивает *css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css'));
```

css-borschik-chunks
-------------------

Из *css*-файлов по deps'ам, собирает `css-chunks.js`-файл, обрабатывая инклуды, ссылки. Умеет минифицировать и фризить.

`css-chunks.js`-файлы нужны для создания bembundle-файлов или bembundle-страниц. Технология bembundle активно используется в bem-tools для выделения из проекта догружаемых кусков функционала и стилей (js/css).

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *Boolean* **minify** — Минифицировать ли в процессе обработки. По умолчанию — `true`.
* *Boolean* **freeze** — Использовать ли фризинг в процессе обработки. По умолчанию — `false`.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/css-borschik-chunks'), {
  minify: true,
  freeze: true
} ]);
```

css-chunks
----------

Из *css*-файлов по deps'ам, собирает `css-chunks.js`-файл, обрабатывая инклуды, ссылки.

`css-chunks.js`-файлы нужны для создания bembundle-файлов или bembundle-страниц. Технология bembundle активно используется в bem-tools для выделения из проекта догружаемых кусков функционала и стилей (js/css).

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-chunks'));
```

css-ie
------

Склеивает *ie.css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.ie.css`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.ie.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-ie'));
```

css-ie6
-------

По аналогии с css-ie.

css-ie7
-------

По аналогии с css-ie.

css-ie8
-------

По аналогии с css-ie.

css-ie9
-------

По аналогии с css-ie.

css-ie-includes
---------------

Собирает *ie.css*-файлы по deps'ам инклудами, сохраняет в виде `?.ie.css`. Может пригодиться в паре с ycssjs (как fastcgi-модуль).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.ie.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-ie-includes'));
```

css-includes
---------------

Собирает *css*-файлы по deps'ам инклудами, сохраняет в виде `?.css`. Может пригодиться в паре с ycssjs (как fastcgi-модуль).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-includes'));
```

css-stylus
----------

Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/css-stylus'));
```

deps
----

Быстро собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости. Сохраняет в виде `?.deps.js`. Следует использовать с осторожностью: в lego не хватает зависимостей, потому проект может собраться иначе, чем с помощью bem-tools.

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
nodeConfig.addTech([ require('enb/techs/deps-merge'))({
  depsSources: ['search.deps.js', 'router.deps.js'],
  depsTarget: 'all.deps.js'
} ]);
```

deps-old
--------

Собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости. Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.

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

Копирует *deps* в текущую ноду под нужным именем из другой ноды. Может понадобиться, например, для объединения deps'ов.

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

Формирует *deps* с помощью вычитания одного deps-файла из другого. Может применяться в паре с `deps-provider` для получения deps для bembundle.

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

Копирует один таргет в другой. Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.

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

file-provider
-------------

Предоставляет существующий файл для make-платформы. Может, например, использоваться для предоставления исходного *bemdecl*-файла.

**Опции**

* *String* **target** — Таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);
```

files
-----

Собирает список исходных файлов для сборки на основе *deps* и *levels*, предоставляет `?.files` и `?.dirs`. Используется многими технологиями, которые объединяют множество файлов из различных уровней переопределения в один.

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

Собирает *html*-файл с помощью *bemjson* и *bemhtml*.

**Опции**

* *String* **bemhtmlTarget** — Исходный BEMHTML-файл. По умолчанию — `?.bemhtml.js`.
* *String* **bemjsonTarget** — Исходный BEMJSON-файл. По умолчанию — `?.bemjson.js`.
* *String* **destTarget** — Результирующий HTML-файл. По умолчанию — `?.html`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/html-from-bemjson'));
```

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

Исходные и конечные таргеты в данный момент не настраиваются (нет запроса).

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.lang.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

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

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/js'));
```

js-bundle-component
-------------------

Собирает `?.bembundle.js`-файл из `?.css-chunks.js` и `?.js-chunks.js`.

Используется вместе с `deps-subtract`, `deps-provider`, `js-chunks`, `css-chunks` для построения догружаемой части функционала сайта.

**Опции**

* *String* **cssChunksTargets** — Имена `css-chunks.js`-таргетов, которые предоставляют CSS-чанки. По умолчанию — `[ '?.css-chunks.js' ]`.
* *String* **jsChunksTargets** — Имена `js-chunks.js`-таргетов, которые предоставляют JS-чанки. По умолчанию — `[ '?.js-chunks.js' ]`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.bembundle.js`.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('enb/techs/levels'), { levels: /* ... */ } ],
  require('enb/techs/files'),
  [ require('enb/techs/deps'), { depsTarget: 'router.tmp.deps.js' } ],
  [ require('enb/techs/deps-provider'), { sourceNodePath: 'pages/index', depsTarget: 'index.deps.js' } ],
  [ require('enb/techs/deps-subtract'), {
    subtractWhatTarget: 'index.deps.js',
    subtractFromTarget: 'router.tmp.deps.js',
    depsTarget: 'router.deps.js'
  } ],
  require('enb/techs/css-chunks'),
  require('enb/techs/js-chunks'),
  require('enb/techs/js-bundle-component')
]);
```

js-bembundle-component-i18n
---------------------------

Собирает `?.bembundle.<язык>.js`-файл из `?.css-chunks.js`,  `?.js-chunks.lang.<язык>.js` и `?.js-chunks.js`.

Используется вместе с `deps-subtract`, `deps-provider`, `js-chunks`, `i18n-lang-js-chunks`, `css-chunks` для построения догружаемой части функционала сайта.

Имена результирующих файлов в данный момент не настраиваются (нет запросов на эту функцию).

**Опции**

* *String* **cssChunksTargets** — Имена `css-chunks.js`-таргетов, которые предоставляют CSS-чанки. По умолчанию — `[ '?.css-chunks.js' ]`.
* *String* **jsChunksTargets** — Имена `js-chunks.js`-таргетов, которые предоставляют JS-чанки. По умолчанию — `[ '?.js-chunks.js' ]`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.bembundle.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('enb/techs/levels'), { levels: /* ... */ } ],
  require('enb/techs/files'),
  [ require('enb/techs/deps'), { depsTarget: 'router.tmp.deps.js' } ],
  [ require('enb/techs/deps-provider'), { sourceNodePath: 'pages/index', depsTarget: 'index.deps.js' } ],
  [ require('enb/techs/deps-subtract'), {
    subtractWhatTarget: 'index.deps.js',
    subtractFromTarget: 'router.tmp.deps.js',
    depsTarget: 'router.deps.js'
  } ],
  require('enb/techs/css-chunks'),
  require('enb/techs/js-chunks'),
  [ require('enb/techs/i18n-merge-keysets'), { lang: 'all' } ],
  [ require('enb/techs/i18n-merge-keysets'), { lang: '{lang}' } ],
  [ require('enb/techs/i18n-lang-js-chunks'), { lang: 'all' } ],
  [ require('enb/techs/i18n-lang-js-chunks'), { lang: '{lang}' } ],
  [ require('enb/techs/js-bembundle-component-i18n'), { lang: '{lang}' } ]
]);
```

js-bundle-page
--------------

Собирает страничный `?.js`-файл из `?.css-chunks.js` и `?.js-chunks.js`.

Результирующий файл готов к догрузке кода из бандлов (JS и CSS, приходящий из бандлов, повторно не выполняется на странице).

**Опции**

* *String* **cssChunksTargets** — Имена `css-chunks.js`-таргетов, которые предоставляют CSS-чанки. По умолчанию — `[ '?.css-chunks.js' ]`.
* *String* **jsChunksTargets** — Имена `js-chunks.js`-таргетов, которые предоставляют JS-чанки. По умолчанию — `[ '?.js-chunks.js' ]`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.js`.

**Пример**

```javascript
nodeConfig.addTechs([
  /* ... */
  require('enb/techs/css-chunks'),
  require('enb/techs/js-chunks'),
  require('enb/techs/js-bundle-page')
]);
```

js-bembundle-page-i18n
----------------------

Собирает страничный `?.<язык>.js`-файл из `?.css-chunks.js`,  `?.js-chunks.lang.<язык>.js` и `?.js-chunks.js`.

Используется вместе с `deps-subtract`, `deps-provider`, `js-chunks`, `i18n-lang-js-chunks`, `css-chunks` для построения догружаемой части функционала сайта.

**Опции**

* *String* **cssChunksTargets** — Имена `css-chunks.js`-таргетов, которые предоставляют CSS-чанки. По умолчанию — `[ '?.css-chunks.js' ]`.
* *String* **jsChunksTargets** — Имена `js-chunks.js`-таргетов, которые предоставляют JS-чанки. По умолчанию — `[ '?.js-chunks.js' ]`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.bembundle.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTechs([
  /* ... */
  require('enb/techs/css-chunks'),
  require('enb/techs/js-chunks'),
  [ require('enb/techs/i18n-merge-keysets'), { lang: 'all' } ],
  [ require('enb/techs/i18n-merge-keysets'), { lang: '{lang}' } ],
  [ require('enb/techs/i18n-lang-js-chunks'), { lang: 'all' } ],
  [ require('enb/techs/i18n-lang-js-chunks'), { lang: '{lang}' } ],
  [ require('enb/techs/js-bembundle-page-i18n'), { lang: '{lang}' } ]
]);
```

js-chunks
---------

Из *js*-файлов по deps'ам, собирает `js-chunks.js`-файл.

`js-chunks.js`-файлы нужны для создания bembundle-файлов или bembundle-страниц. Технология bembundle активно используется в bem-tools для выделения из проекта догружаемых кусков функционала и стилей (js/css).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.js-chunks.js`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/js-chunks'));
```

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

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/js-includes'));
```

levels
------

Собирает информацию об уровнях переопределения проекта, предоставляет `?.levels`. Результат выполнения этой технологии необходим технологиям `enb/techs/deps`, `enb/techs/deps-old` и `enb/techs/files`.

Для каждой ноды по умолчанию добавляется уровень `<путь_к_ноде>/blocks`. Например, для ноды `pages/index` — `pages/index/blocks`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.levels`.
* *(String|Object)[]* **levels** — Уровни переопределения. Полные пути к папкам с уровнями переопределения. Вместо строки с уровнем может использоваться объект вида `{path: '/home/user/www/proj/lego/blocks-desktop', check: false}` для того, чтобы закэшировать содержимое тех уровней переопределения, которые не модифицируются в рамках проекта.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/levels'), {
  levels: [
    {path: 'lego/blocks-desktop', check: false},
    'desktop.blocks'
  ].map(function(level) { return config.resolvePath(level); })
} ]);
```

priv-js
-------

Собирает `?.priv.js` по deps'ам, обрабатывая Борщиком, добавляет BEMHTML в начало.

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **bemhtmlTarget** — Имя `bemhtml.js`-таргета. По умолчанию — `?.bemhtml.js`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/priv-js'));
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

xsl
---

Собирает `?.xsl` по deps'ам.

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.xsl`.
* *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
* *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/xsl'));
```

xsl-2lego
---------

Собирает `?.2lego.xsl` по deps'ам.

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.2lego.xsl`.
* *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
* *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/2lego.xsl'));
```

xsl-convert2xml
---------------

Собирает `?.convert2xml.xsl` по deps'ам.

**Опции**

* *String* **transformXslFile** — Путь к convert2xml.xsl из lego/tools.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.convert2xml.xsl`.
* *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
* *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/xsl-convert2xml'), {
  transformXslFile: config.resolvePath('blocks/lego/tools/convert2xml.xsl')
} ]);
```

xsl-html5
---------

Собирает `?.xsl` по deps'ам для HTML5-страницы.

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.xsl`.
* *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
* *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.

**Пример**

```javascript
nodeConfig.addTech(require('enb/techs/xsl-html5'));
```

xsl-html5-i18n
--------------

Собирает `?.<язык>.xsl`-файл по deps'ам, добавляя `?.lang.<язык>.xsl`-файл.

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **target** — Результирующий таргет. По умолчанию — `?.{lang}.xsl`.
* *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
* *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.


**Пример**

```javascript
nodeConfig.addTech([ require('xsl-html5-18n'), { lang: '{lang}' } ]);
```

xslt
----

Выполняет XSLT-преобразование.

**Опции**

* *String* **sourceTarget** — Исходный таргет. Обязательная опция.
* *String* **destTarget** — Результирующий таргет. Обязательная опция.
* *String* **xslSource** — XSL-Таргет, с помощью которого производится трансформация.
* *String* **xslFile** — XSL-Файл, с помощью которого производится трансформация (используется, если XSL-файл не является таргетом).
* *String[]* **args** — Аргументы для xsltproc. По умолчанию — `[]`.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/xslt'))({
    sourceTarget: '?.keysets.{lang}.xml',
    destTarget: '?.lang.{lang}.xsl',
    xslFile: config.resolvePath('blocks/lego/tools/tanker/tools/generate/i18n.xsl.xsl'),
    args: ['--xinclude']
}]);
```

Как написать свою технологию
============================

Каждая технология должна иметь методы:

```javascript
{undefined|Promise} init(Node node) // Инициализирует технологию для указанной ноды.
{String} getName() // Возвращает имя технологии.
{String[]|Promise} getTargets() // Возвращает таргеты, которые технология собирается сбилдить в рамках ноды.
{undefined|Promise} build() // Билдит таргеты.
{undefined|Promise} clean() // Удаляет таргеты.
```

Пример технологии:

```javascript
var 
  inherit = require('inherit'),
  vowFs = require('vow-fs');

modules.exports = inherit(require('enb/lib/tech/base-tech'), {
  // init наследуем от base-tech, где node записывается в this.node.
  getName: function() {
    return 'hello-world-tech';
  },
  getTargets: function() {
    return this.node.unmaskTargetName('?.js');
  },
  build: function() {
    var
      _this = this,
      targetName = this.node.unmaskTargetName('?.js'),
      targetPath = this.node.resolvePath(targetName);
    return vowFs.write(targetPath, 'alert("Hello World");', 'utf8').then(function() {
      _this.node.resolveTarget(targetName);
    });
  }
  // clean наследуем от base-tech, где просто удаляются все файлы на основе результата getTargets().
});
```

Node API
========

Каждой технологии в `init` приходит инстанция ноды, для которой необходимо собирать таргеты. Через ноду технология взаимодействует с процессом сборки.

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

node.getRoot
------------

```javascript
// Возвращает полный путь к корневой папке проекта.
String Node::getRoot()
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
