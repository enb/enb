/**
 * js-module
 * =========
 */
var inherit = require('inherit'),
    fs = require('graceful-fs'),
    vm = require('vm'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = require('../lib/build-flow').create()
    .name('js-i18n-module')
    .target('target', '?.js')
    .defineOption('amdTarget', '?.amd.js')
    .useFileList('js')
    .justJoinFilesWithComments()
    .needRebuild(function(cache) {
        return cache.needRebuildFile('amd-file', this.node.resolvePath(this.node.unmaskTargetName(this._amdTarget)));
    })
    .saveCache(function(cache) {
        return cache.cacheFileInfo('amd-file', this.node.resolvePath(this.node.unmaskTargetName(this._amdTarget)));
    })
    .wrapper(function(js) {
        var amdTarget = this.node.unmaskTargetName(this._amdTarget),
            amdFilename = this.node.resolvePath(amdTarget),
            amd = {};
        if (fs.existsSync(amdFilename)) {
            amd = vm.runInThisContext(fs.readFileSync(amdFilename, 'utf8'));
        } else {
            this.node.getLogger().logWarningAction('notFound', this.node.getPath() + '/' + amdTarget);
        }
        var chunks = [js];
        require('./js-module').wrapModule(this.node.getTargetName(), chunks, amd);
        return chunks.join('\n');

    })
    .staticMethods({
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
    })
    .createTech();
