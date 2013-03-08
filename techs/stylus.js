var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    stylus = require('stylus');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'stylus';
    },
    getDestSuffixes: function() {
        return ['css'];
    },
    getSourceSuffixes: function() {
        return ['css', 'styl'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        var promise = Vow.promise();
        var res = sourceFiles.map(function(file) {
            return '@import "' + file.fullname + '";';
        });
        stylus(res.join('\n'))
          .set('filename', this.node.resolvePath(this.node.getTargetName(suffix)))
          .render(function(err, css) {
              if (err) {
                  return promise.reject(err);
              }
              css = css.replace(/@import "([^"]+)";/g, function(s, fn) {
                  return fs.readFileSync(fn, "utf8");
              });
              return promise.fulfill(css);
          });
        return promise;
    }
});