Как собрать проект?
===================

Процесс сборки
--------------

1. Какие таргеты необходимо билдить `ENB` узнаёт из команды `enb make [target]`. Если вы запустили `enb make` без указания конкретного таргета, `ENB` будет собирать все таргеты, определенные в `make.js`.
2. `ENB` инициализирует ноды, участвующие в сборке указанных таргетов. В это время каждая нода спрашивает у технологий (которые регистрировались внутри ноды) список таргетов.
3. Запускаются технологии, которые отвечают за те таргеты, которые необходимо билдить.
4. В процессе выполнения технология может потребовать у ноды другие таргеты, необходимые для сборки (с помощью метода `requireSources`). В таком случае технология приостанавливается, нода запускает технологии, отвечающие за требуемые таргеты (если они не запущены) и после того, как технологии заканчивают сборку нужных таргетов, продолжает свою работу искомая технология.
5. После того, как технология выполнила свою работу по сборке таргета, она оповещает об этом ноду (с помощью метода `resolveTarget`).
6. Сборка завершается после того, как все необходимые таргеты собраны.

Пошаговое руководство
---------------------

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
----------------

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

Сборка по требованию
--------------------

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
var clearRequire = require('clear-require');
var enbBuilder = require('enb/lib/server/server-middleware').createBuilder();
app
    .get('/', function (req, res, next) {
        var bemhtmlFilePath = 'pages/index/index.bemhtml.js';
        enbBuilder(bemhtmlFilePath).then(function() {
            var bemhtmlAbsFilePath = process.process.cwd() + '/' + bemhtmlFilePath;
            clearRequire(bemhtmlAbsFilePath);
            var bemhtml = require(bemhtmlAbsFilePath);
            res.end(bemhtml.BEMHTML.apply({block: 'b-page', content: 'Hello World'}));
            next();
        }, next);
    });
```

