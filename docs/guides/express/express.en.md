# Automation with express

Developing `Node.js` applications with `express` simplifies the use of `enb` in the development mode:

* Does not require rebuilding the project and additional ports for statics.
* Allows you to send requests for build on demand, that is, when you open your project in the browser.

To automate the ENB build using `express`, use ` express`-compatible ` middleware`. It is returned by the `createMiddleware` method of the `lib/server/server-middleware` module.

```javascript
/**
 * @param {Object} options
 * @param {String} options.cdir Root directory of the project.
 * @param {Boolean} options.noLog Don't log the build process in the console.
 * @returns {Function}
 */
module.exports.createMiddleware = function(options) { /* ... */ };
```

Usage example:

```javascript
app
    .use(require('enb/lib/server/middleware').createMiddleware())
    .get('/', function (req, res) {
        /* ... */    });
```
