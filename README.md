ENB
===

Инструментарий для работы с проектами, основанными на идеологии BEM.

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

* ENB (как платформа) свободна от идеологии BEM. С помощью нее можно любой проект, которые строится на модели node / target. Сбор префиксов не является частью платформы, а реализуется с помощью одной и технологий.
* Технологии в ENB не ограничены в том, каким образом они будут собирать те или иные таргеты.
* Все технологии настраиваемые (в большей или меньшей степени).
* ENB сложнее настроить для проекта. В нем нет готовых шаблонов make-файлов.
* В рамках ENB одна и та же технология может быть использована с разными опциями. Например, можно построить несколько разных `deps.js` в рамках одной ноды на основе различных `bemdecl.js`.

Благодарности
-------------

* Дмитрию Филатову (http://staff.yandex-team.ru/dfilatov). За `vow`, `vow-fs`, `inherit`, советы, поддержку и мотивацию.
* Дмитрию Ковалю (http://staff.yandex-team.ru/smith). За помощь в сборке тестов, production-режима и здоровый скептицизм.
* Александру Тармолову (http://staff.yandex-team.ru/hevil). За помощь с `git`, `modules`, поддержку и полезные ссылки.
* Сергею Бережному (http://staff.yandex-team.ru/veged). За `borschik`, советы и правильные вопросы.
* Команде разработчиков bem-tools. За часть заимствованного кода.

Терминология
------------

* Target (таргет) — это цель для сборки. Например, таргетом может быть `index.js` в рамках ноды `pages/index`..
* Node (нода) — это папка, в которой находятся те или иные таргеты. Например, `pages/index`.
* Suffix (суффикс) — это расширение исходного или конечного файла. Например, `js`.
* Masked Target (замаскированный таргет) — это имя таргета, которое может содержать `?`. Знак `?` заменяется на имя ноды в процессе настройки технологии. Например, таргет `?.js` заменяется на `search.js`, если нода — `pages/search`. Такой подход удобен, когда мы настраиваем несколько нод через `nodeMask`.
* Make-файл — файл, в котором конфигурируется ENB для сборки проекта. Находится в папке `<project_root>/.bem/enb-make.js`.
* Билдить — собирать, компилировать (используется в отношении таргетов).

Процесс сборки
--------------

1. Определяется, какие таргеты необходимо билдить. Если мы запустили `enb make` без указания конкретного таргета, то используются все таргеты, определенные в make-файле.
2. Инициализируются ноды, участвующие в сборке указанных таргетов. В процессе инициализации каждая нода спрашивает у технологий (которые регистрировались в рамках ноды) список таргетов.
3. Запускаются технологии, которые отвечают за те таргеты, которые необходимо билдить.
4. В процессе выполнения технология может потребовать у ноды другие таргеты, необходимые для сборки (с помощью метода `requireSources`). В таком случае технология приостанавливается, нода запускает технологии, отвечающие за требуемые таргеты (если они не запущены) и после того, как технологии заканчивают сборку нужных таргетов, продолжает свою работу искомая технология.
5. После того, как технология выполнила свою работу по сборке таргета, она оповещает об этом ноде (с помощью метода `resolveTarget`).
6. Сборка завершается после того, как все необходимые таргеты собраны.

Как собрать проект (пошаговое руководство)
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
          new (require('enb/techs/levels'))({ levels: getLevels(config) }),
          new (require('enb/techs/file-provider'))({ target: '?.bemdecl.js' }),
          new (require('enb/techs/deps-old'))(),
          new (require('enb/techs/files'))()
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
          new (require('enb/techs/levels'))({ levels: getLevels(config) }),
          new (require('enb/techs/file-provider'))({ target: '?.bemdecl.js' }),
          new (require('enb/techs/deps-old'))(),
          new (require('enb/techs/files'))(),
          new (require('enb/techs/js'))(),
          new (require('enb/techs/css'))()
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
          new (require('enb/techs/levels'))({ levels: getLevels(config) }),
          new (require('enb/techs/file-provider'))({ target: '?.bemdecl.js' }),
          new (require('enb/techs/deps-old'))(),
          new (require('enb/techs/files'))(),
          new (require('enb/techs/js'))(),
          new (require('enb/techs/css'))(),
          new (require('enb/techs/file-copy'))({ sourceTarget: '?.js', destTarget: '_?.js' }),
          new (require('enb/techs/file-copy'))({ sourceTarget: '?.css', destTarget: '_?.css' })
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
          new (require('enb/techs/levels'))({ levels: getLevels(config) }),
          new (require('enb/techs/file-provider'))({ target: '?.bemdecl.js' }),
          new (require('enb/techs/deps-old'))(),
          new (require('enb/techs/files'))(),
          new (require('enb/techs/js'))(),
          new (require('enb/techs/css'))()
        ]);
        nodeConfig.addTargets(['_?.js', '_?.css']);
      });
      config.mode('development', function() {
        config.node('pages/index', function(nodeConfig) {
          nodeConfig.addTechs([
            new (require('enb/techs/file-copy'))({ sourceTarget: '?.js', destTarget: '_?.js' }),
            new (require('enb/techs/file-copy'))({ sourceTarget: '?.css', destTarget: '_?.css' })
          ]);
        });
      });
      config.mode('production', function() {
        config.node('pages/index', function(nodeConfig) {
          nodeConfig.addTechs([
            new (require('enb/techs/borschik'))({ sourceTarget: '?.js', destTarget: '_?.js', minify: true }),
            new (require('enb/techs/borschik'))({ sourceTarget: '?.css', destTarget: '_?.css', minify: true })
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

Подробное описание актуальных технологий
========================================

В алфавитном порядке.

Все технологии, включенные в пакет ENB, находятся в папке `techs` пакета. Подключаются из make-файла с помощью `require('enb/techs/<tech-name>')`. Например, `require('enb/techs/js')`. Подключаются к ноде созданием инстанции: `nodeConfig.addTech(new (require('enb/techs/<tech-name>'))({/* [options] */}));`.

bemdecl-from-bemjson
--------------------

Формирует *bemdecl* на основе `?.bemjson.js`.

**Опции**

* *String* **sourceTarget** — Исходный bemjson-таргет. По умолчанию — `?.bemjson.js`.
* *String* **destTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/bemdecl-from-bemjson'))());
```

bemdecl-merge
-------------

Формирует *bemdecl* с помощью объединения других bemdecl-файлов.

**Опции**

* *String[]* **bemdeclSources** — Исходные bemdecl-таргеты. Обязательная опция.
* *String* **bemdeclTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/bemdecl-merge'))({
  bemdeclSources: ['search.bemdecl.js', 'router.bemdecl.js'],
  bemdeclTarget: 'all.bemdecl.js'
}));
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
nodeConfig.addTech(new (require('enb/techs/bemdecl-provider'))({
  sourceNodePath: 'bundles/router',
  sourceTarget: 'router.bemdecl.js',
  bemdeclTarget: 'router.bemdecl.js'
}));
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
nodeConfig.addTech(new (require('enb/techs/bemhtml'))());
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
nodeConfig.addTech(new (require('enb/techs/borschik'))({
  sourceTarget: '?.css',
  destTarget: '_?.css',
  minify: true,
  freeze: true
}));
```

css
---

Склеивает *css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/css'))());
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
nodeConfig.addTech(new (require('enb/techs/css-borschik-chunks'))({
  minify: true,
  freeze: true
}));
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
nodeConfig.addTech(new (require('enb/techs/css-chunks'))());
```

css-ie
------

Склеивает *ie.css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.ie.css`.

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/css-ie'))());
```

css-ie-includes
---------------

Собирает *ie.css*-файлы по deps'ам инклудами, сохраняет в виде `?.ie.css`. Может пригодиться в паре с ycssjs (как fastcgi-модуль).

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/css-ie-includes'))());
```

css-includes
---------------

Собирает *css*-файлы по deps'ам инклудами, сохраняет в виде `?.css`. Может пригодиться в паре с ycssjs (как fastcgi-модуль).

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/css-includes'))());
```

css-stylus
----------

Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.

Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/css-stylus'))());
```

deps
----

Быстро собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости. Сохраняет в виде `?.deps.js`. Следует использовать с осторожностью: в lego не хватает зависимостей, потому проект может собраться иначе, чем с помощью bem-tools.

Имя *levels*-таргета в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **bemdeclTarget** — Исходный bemdecl. По умолчанию — `?.bemdecl.js`.
* *String* **depsTarget** — Результирующий deps. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(new (require('enb/techs/deps'))());
```

Сборка специфического deps:
```javascript
nodeConfig.addTech(new (require('enb/techs/deps'))({
  bemdeclTarget: 'search.bemdecl.js',
  depsTarget: 'search.deps.js'
}));
```

bemdecl-merge
-------------

Формирует *deps* с помощью объединения других deps-файлов.

**Опции**

* *String[]* **depsSources** — Исходные deps-таргеты. Обязательная опция.
* *String* **depsTarget** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.

**Пример**

```javascript
nodeConfig.addTech(new (require('enb/techs/deps-merge'))({
  depsSources: ['search.deps.js', 'router.deps.js'],
  depsTarget: 'all.deps.js'
}));
```

deps-old
--------

Собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости. Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.

Имя *levels*-таргета в данный момент не настраивается (нет запросов на эту функцию).

**Опции**

* *String* **bemdeclTarget** — Исходный bemdecl. По умолчанию — `?.bemdecl.js`.
* *String* **depsTarget** — Результирующий deps. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(new (require('enb/techs/deps-old'))());
```

Сборка специфического deps:
```javascript
nodeConfig.addTech(new (require('enb/techs/deps-old'))({
  bemdeclTarget: 'search.bemdecl.js',
  depsTarget: 'search.deps.js'
}));
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
nodeConfig.addTech(new (require('enb/techs/deps-provider'))({
  sourceNodePath: 'bundles/router',
  sourceTarget: 'router.deps.js',
  bemdeclTarget: 'router.deps.js'
}));
```

deps-subtract
-------------

