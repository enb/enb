# Автоматизация с помощью express

Разработка `Node.js`-приложений на базе `express` упрощает использование `enb` в development-режиме: 

* не требует пересборки проекта и дополнительных портов для статики;
* позволяет отправлять запросы на сборку по требованию, то есть, когда вы открываете в браузере свой проект.

Чтобы автоматизировать сборку ENB с помощью `express`, используйте `express`-совместимое `middleware`. Его возвращает метод `createMiddleware` модуля `lib/server/server-middleware`.

```javascript
/**
 * @param {Object} options
 * @param {String} options.cdir Корневая директория проекта.
 * @param {Boolean} options.noLog Не логировать в консоль процесс сборки.
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
