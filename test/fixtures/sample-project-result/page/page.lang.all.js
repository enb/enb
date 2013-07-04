BEM = { I18N: function(keysetName, key) { return (BEM.I18N.keysets[keysetName] || {})[key] || ""; } };
BEM.I18N.keysets = {};
BEM.I18N.decl = function(keysetName, keysetData) {
   BEM.I18N.keysets[keysetName] = keysetData;
};
BEM.I18N.lang = function(){};
