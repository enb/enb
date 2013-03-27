var Vow = require('vow');

module.exports = require('../lib/build-flow').create()
    .name('js-bundle-component')
    .useSourceListFilenames('jsChunksTargets', ['?.js-chunks.js'])
    .useSourceListFilenames('cssChunksTargets', ['?.css-chunks.js'])
    .target('target', '?.bembundle.js')
    .builder(function(jsChunkFilenames, cssChunkFilenames) {
        var _this = this,
            jsChunks = [],
            cssChunks = [];
        cssChunkFilenames.forEach(function(cssChunksFilename) {
            delete require.cache[cssChunksFilename];
            cssChunks = cssChunks.concat(require(cssChunksFilename));
        });
        jsChunkFilenames.forEach(function(jsChunksFilename) {
            delete require.cache[jsChunksFilename];
            jsChunks = jsChunks.concat(require(jsChunksFilename));
        });
        return this.buildBundle(jsChunks, cssChunks);
    })
    .methods({
        buildBundle: function(jsChunks, cssChunks) {
            var _this = this;
            return Vow.when(this.buildJsBody(jsChunks)).then(function(jsBody) {
                var hcssChunks = cssChunks.map(function(chunk) {
                    return [chunk.hash, chunk.data];
                });
                return [
                    'BEM.blocks[\'i-loader\'].loaded({',
                    'id: \'', _this.node.getTargetName(), '\',\n',
                    'js: function(){\n',
                        _this.__self.getOnceFunctionDecl(),
                        '\n',
                        jsBody,
                    '\n},\n',
                    'hcss: ', JSON.stringify(hcssChunks, null, 4), '\n',
                    '});'
                ].join('');
            });
        },
        buildJsBody: function(jsChunks) {
            var _this = this;
            return jsChunks.map(function(chunk) {
                return _this.__self.wrapWithOnceIf(chunk.data, chunk.fullname, chunk.hash);
            }).join('\n');
        }
    })
    .staticMethods({
        getOnceFunctionDecl: function() {
            return '(function(){ this._ycssjs || (this._ycssjs=function(a,b){return !(a in _ycssjs||_ycssjs[a]++)}) })();\n';
        },
        wrapWithOnceIf: function(data, filename, hash) {
            return 'if (_ycssjs("' + hash + '")) {\n' + '// ' + filename + '\n' + data + '\n}';
        },
        getExistingChunkDecl: function(hash) {
            return '_ycssjs("' + hash + '");\n';
        }
    })
    .createTech();