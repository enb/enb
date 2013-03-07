var fs = require('fs'),
    Vow = require('vow'),
    stylus = require('stylus');

function StylusTech() {}

StylusTech.prototype = {

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('styl.css')];
    },

    build: function() {
        var promise = Vow.promise(), _this = this;
        try {
            var target = this.node.getTargetName('styl.css'),
                targetPath = this.node.resolvePath(target);
            this.node.requireSources([this.node.getTargetName('files')]).spread((function(files) {
                try {
                    var res = [];
                    var filesBySuffix = files.getBySuffix(['styl', 'css']);
                    for (var i = 0, l = filesBySuffix.length; i < l; i++) {
                        res.push('@import "' + filesBySuffix[i].fullname + '";');
                    }
                    stylus(res.join('\n'))
                      .set('filename', _this.node.resolvePath(target))
                      .render(function(err, css) {
                          if (err) {
                              return promise.reject(err);
                          }
                          css = css.replace(/@import "([^"]+)";/g, function(s, fn) {
                              return fs.readFileSync(fn, "utf8");
                          });
                          fs.writeFileSync(targetPath, css, "utf8");
                          _this.node.resolveTarget(target);
                          return promise.fulfill();
                      });
                } catch (err) {
                    return promise.reject(err);
                }
            }), function(err) {
                return promise.reject(err);
            });
        } catch (e) {
            promise.reject(e);
        }
        return promise;
    }
};

module.exports = StylusTech;