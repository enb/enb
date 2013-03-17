var inherit = require('inherit'),
    Vow = require('vow'),
    JsBembundleComponent = require('./js-bembundle-component');

module.exports = inherit(JsBembundleComponent, {
    configure: function() {
        this.__base();
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.js'));
    },
    _buildTargetResult: function(target, jsChunks, cssChunks) {
        return Vow.when(this._buildJsBody(jsChunks, target)).then(function(jsBody) {
            var res = [jsBody];
            res = res.concat(cssChunks.map(function(cssChunk) {
                return JsBembundleComponent.getExistingChunkDecl(cssChunk.hash);
            }));
            return JsBembundleComponent.getOnceFunctionDecl() + res.join('\n');
        });
    }
});