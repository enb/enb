module.exports = {
    all: {
        '': 'BEM = { I18N: function(keysetName, key) { return (BEM.I18N.keysets[keysetName] || {})[key] || ""; } };\n' +
            'BEM.I18N.keysets = {};\n' +
            'BEM.I18N.decl = function(keysetName, keysetData) {\n' +
            '   BEM.I18N.keysets[keysetName] = keysetData;\n' +
            '};\n' +
            'BEM.I18N.lang = function(){};\n'
    }
};
