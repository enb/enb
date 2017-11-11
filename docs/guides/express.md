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
    .use(require('enb/lib/server/middleware').createMiddleware())
    .get('/', function (req, res) {
        /* ... */
    });
```
