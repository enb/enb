/**
 * js-bembundle-page-i18n-module
 * =============================
 */
var fs = require('fs'),
    vm = require('vm');

module.exports = require('./js-bembundle-page-i18n').buildFlow()
    .name('js-bembundle-page-i18n-module')
    .defineOption('amdTarget', '?.amd.js')
    .needRebuild(function(cache) {
        return cache.needRebuildFile('amd-file', this.node.resolvePath(this.node.unmaskTargetName(this._amdTarget)));
    })
    .saveCache(function(cache) {
        return cache.cacheFileInfo('amd-file', this.node.resolvePath(this.node.unmaskTargetName(this._amdTarget)));
    })
    .methods({
        buildJsBody: function(jsChunks) {
            var _this = this,
                res = [jsChunks.map(function(chunk) {
                    return _this.__self.wrapWithOnceIf(chunk.data, chunk.fullname, chunk.hash);
                }).join('\n')];
            var
                amdFilename = _this.node.resolvePath(_this.node.unmaskTargetName(this._amdTarget)),
                amd = {};
            if (fs.existsSync(amdFilename)) {
                amd = vm.runInThisContext(fs.readFileSync(amdFilename, 'utf8'));
            } else {
                _this.node.getLogger().logWarningAction('notFound', _this.node.getPath() + '/' + _this.node.getTargetName('amd.js'));
            }
            require('./js-module').wrapModule(_this.node.getTargetName(), res, amd);
            return res.join('\n');
        }
    })
    .createTech();
