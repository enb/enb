var inherit = require('inherit');

module.exports = inherit(require('./js-bembundle-page'), {

    getName: function() {
        return 'js-bembundle-page-i18n';
    },

    configure: function() {
        this.__base();
        this._languages = this.getOption('languages', this.node.getLanguages() || []);
    },

    getTargets: function() {
        var _this = this;
        return this._languages.map(function(lang) {
            return _this.node.getTargetName(lang + '.js');
        });
    },

    _getJsChunkTargets: function(target) {
        var targetParts = target.split('.'),
            lang = targetParts[targetParts.length - 2];
        return [
            this._jsChunksTarget,
            this.node.getTargetName('js-chunks.lang.all.js'),
            this.node.getTargetName('js-chunks.lang.' + lang + '.js')
        ];
    }
});