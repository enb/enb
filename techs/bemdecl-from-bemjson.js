var Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    vm = require('vm');

module.exports = require('../lib/build-flow').create()
    .name('bemdecl-from-bemjson')
    .target('destTarget', '?.bemdecl.js')
    .useSourceText('destTarget', '?.bemjson.js')
    .builder(function(bemjsonText) {
        var json = vm.runInThisContext(bemjsonText),
            decl = [];
        iterateJson(json, getBuilder(decl));
        return 'exports.blocks = ' + JSON.stringify(mergeDecls([], decl), null, 4) + ';';
    })
    .createTech();

// --- (C) Original BEM Tools

function mergeDecls(d1, d2) {
    var keys = {};
    d1?
        d1.forEach(function(o) { keys[o.name || o] = o }) :
        d1 = [];

    d2.forEach(function(o2) {
        var name = o2.name || o2;
        if (keys.hasOwnProperty(name)) {
            var o1 = keys[name];
            o2.elems && (o1.elems = mergeDecls(o1.elems, o2.elems));
            o2.mods && (o1.mods = mergeDecls(o1.mods, o2.mods));
            o2.vals && (o1.vals = mergeDecls(o1.vals, o2.vals));
            o2.techs && (o1.techs = mergeDecls(o1.techs, o2.techs));
        } else {
            d1.push(o2);
            keys[name] = o2;
        }
    });

    return d1;
}

function isSimple(obj) {
    var t = typeof obj;
    return t === 'string' || t === 'number' || t === 'boolean';
}

function iterateJson(obj, fn) {
    if(obj && !isSimple(obj))
        if(Array.isArray(obj)) {
            var i = 0, l = obj.length;
            while(i < l) iterateJson(obj[i++], fn);
        } else fn(obj);
    return obj;
}

function getBuilder(decl, block) {
    return function(obj) {
        var oldBlock = block;
        block = obj.block || block;
        obj.block && decl.push({ name: block });
        obj.elem && decl.push({ name: block, elems: [{ name: obj.elem }] });
        var mods, n, props;
        if(mods = obj.mods)
            for(n in mods)
                if(mods.hasOwnProperty(n))
                    decl.push({
                        name: block,
                        mods: [{ name: n, vals: [ mods[n] ] }]
                    });
        if(obj.elem && (mods = obj.elemMods))
            for(n in mods)
                if(mods.hasOwnProperty(n))
                    decl.push({
                        name: block,
                        elems: [{
                            name: obj.elem,
                            mods: [{ name: n, vals: [ mods[n] ] }]
                        }]
                    });
        props = Object.keys(obj).filter(function(k) {
                return !({ block: 1, elem: 1, mods: 1, elemMods: 1 }).hasOwnProperty(k);
            }).map(function(k) {
                return obj[k];
            });
        iterateJson(props, getBuilder(decl, block));
        block = oldBlock;
    }
}