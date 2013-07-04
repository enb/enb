/* begin: ../blocks/page/page.js */
BEM.DOM.decl('page', {

});

/* end: ../blocks/page/page.js */
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