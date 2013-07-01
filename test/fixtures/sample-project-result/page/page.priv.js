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
