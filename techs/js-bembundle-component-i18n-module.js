var inherit = require('inherit'),
    Vow = require('vow'),
    fs = require('fs'),
    vm = require('vm');

module.exports = inherit(require('./js-bembundle-component-i18n'), {
    getName: function() {
        return 'js-bembundle-component-i18n-module';
    },

    _buildJsBody: function(jsChunks, target) {
        var _this = this;
        return Vow.when(this.__base(jsChunks, target)).then(function(js) {
            var res = [js],
                amdFilename = _this.node.resolvePath(_this.node.getTargetName('amd.js')),
                amd = {};
            if (fs.existsSync(amdFilename)) {
                amd = vm.runInThisContext(fs.readFileSync(amdFilename, 'utf8'));
            } else {
                _this.node.getLogger().logWarningAction('notFound', _this.node.getPath() + '/' + _this.node.getTargetName('amd.js'));
            }
            require('./js-module').wrapModule(_this.node.getTargetName(), res, amd);
            return res.join('\n');
        });
    }

});