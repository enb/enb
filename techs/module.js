  var fs = require('fs'),
      Vow = require('vow'),
      FileList = require('../lib/file-list'),
      vm = require('vm');

function FilesTech() {}

FilesTech.prototype = {
    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('module.js')];
    },

    build: function() {
        var promise = Vow.promise(),
            _this = this;
        try {
            var target = this.node.getTargetName('module.js'),
                targetPath = this.node.resolvePath(target);
            this.node.requireSources([this.node.getTargetName('files')]).spread((function(files) {
                try {
                    var FilesCache = require('../lib/cache/files-cache'),
                        res = [],
                        cache = _this.node.getCache(_this.node.getTargetName('tech-js'), FilesCache);
                    files = files.getBySuffix('js');
                    if (cache.isValid(files)) {
                        _this.node.logger.isValid(target);
                    } else {
                        cache.setValue(files);
                        cache.save();
                        for (var i = 0, l = files.length; i < l; i++) {
                            res.push('include("' + files[i].fullname + '");');
                        }
                        res.push('BEM.I18N = function(keyset, key) {return key;};');
                        _this.wrapModule(res, vm.runInThisContext(fs.readFileSync(_this.node.resolvePath(_this.node.getTargetName('amd.js')), 'utf-8')));
                        fs.writeFileSync(targetPath, res.join('\n'), "utf8");
                    }
                    _this.node.resolveTarget(target);
                    return promise.fulfill();
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
    },

    wrapModule: function(res, amd) {
        var modules = [],
            args = [],
            provides = [];
        provides.push({
            module: this.node.getTargetName(),
            value: 'true'
        });
        amd.requires && amd.requires.forEach(function(item) {
            modules.push('\'' + item.module + '\'');
            return args.push(item.arg);
        });
        amd.provides && amd.provides.forEach(function(item) {
            return provides.push(item);
        });
        res.unshift('require([' + modules.join(', ') + '], function(' + args.join(', ') + ') {\n');
        provides.forEach(function(provide) {
            return res.push('require.provide(\'' + provide.module + '\', ' + provide.value + ');\n');
        });
        return res.push('\n});');
    }
};

module.exports = FilesTech;
