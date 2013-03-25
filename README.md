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
5. После того, как технология выполнила свою работу по сборке таргета, она оповещает об этом ноду (с помощью метода `resolveTarget`).
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
