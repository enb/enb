/* begin: ./page.lang.all.js */
BEM = { I18N: function(keysetName, key) { return (BEM.I18N.keysets[keysetName] || {})[key] || ""; } };
BEM.I18N.keysets = {};
BEM.I18N.decl = function(keysetName, keysetData) {
   BEM.I18N.keysets[keysetName] = keysetData;
};
BEM.I18N.lang = function(){};

/* end: ./page.lang.all.js */
/* begin: ./page.lang.en.js */
BEM.I18N.decl('page', {
    "welcome": 'Welcome to test app'
}, {
"lang": "en"
});

BEM.I18N.lang('en');

/* end: ./page.lang.en.js */
/* begin: ./page.priv.js */
delete require.cache[require.resolve("../../../../node_modules/bh/lib/bh.js")];
var BH = require("../../../../node_modules/bh/lib/bh.js");
var bh = new BH();
delete require.cache[require.resolve("../blocks/button/button.bh.js")];
require("../blocks/button/button.bh.js")(bh);
delete require.cache[require.resolve("../blocks/page/page.bh.js")];
require("../blocks/page/page.bh.js")(bh);
module.exports = bh;
bh.BEMHTML = { apply: function(bemjson) { return bh.apply(bemjson); } };
/* ../blocks/page/page.priv.js: begin */
blocks['page'] = function() { return { block: 'page' }; };

/* ../blocks/page/page.priv.js: end */

if (typeof exports !== "undefined" && typeof blocks !== "undefined") { exports.blocks = blocks; }

/* end: ./page.priv.js */