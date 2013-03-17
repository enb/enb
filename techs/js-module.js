var inherit = require('inherit'),
    fs = require('fs'),
    vm = require('vm'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'js-module';
    },
    getDestSuffixes: function() {
        return ['js'];
    },
    getSourceSuffixes: function() {
        return ['js'];
    },
    _buildChunks: function(sourceFiles, suffix) {
        return Vow.all(sourceFiles.map(function(file) {
            return vowFs.read(file.fullname, 'utf8');
        }));
    },
    getBuildResult: function(sourceFiles, suffix) {
        var _this = this;
        return Vow.when(this._buildChunks(sourceFiles, suffix)).then(function(chunks) {
            var amdFilename = _this.node.resolvePath(_this.node.getTargetName('amd.js')),
                amd = {};
            if (fs.existsSync(amdFilename)) {
                amd = vm.runInThisContext(fs.readFileSync(amdFilename, 'utf8'));
            } else {
                _this.node.getLogger().logWarningAction('notFound', _this.node.getPath() + '/' + _this.node.getTargetName('amd.js'));
            }
            _this.__self.wrapModule(_this.node.getTargetName(), chunks, amd);
            return chunks.join('\n');
        });
    }
}, {
    wrapModule: function(moduleName, res, amd) {
        var modules = [],
            args = [],
            provides = [];
        provides.push({
            module: moduleName,
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
});
