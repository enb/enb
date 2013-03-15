var Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    vm = require('vm');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'bemdecl-from-bemjson';
    },

    configure: function() {
        this._source = this.getOption('sourceTarget', this.node.getTargetName('bemjson.js'));
        this._target = this.getOption('destTarget', this.node.getTargetName('bemdecl.js'));
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function() {
        var target = this.node.unmaskTargetName(this._target),
            targetPath = this.node.resolvePath(target),
            source = this.node.unmaskTargetName(this._source),
            sourcePath = this.node.resolvePath(source),
            _this = this,
            cache = this.node.getNodeCache(target);
        return this.node.requireSources([source]).then(function() {
            if (cache.needRebuildFile('source-file', sourcePath)
                    || cache.needRebuildFile('target-file', targetPath)) {
                return vowFs.read(sourcePath, 'utf8').then(function(data) {
                    var json = vm.runInThisContext(data),
                        decl = [];
                    iterateJson(json, getBuilder(decl));
                    var bemdeclData = 'exports.blocks =     ' + JSON.stringify(mergeDecls([], decl), null, 4) + ';';
                    return vowFs.write(targetPath, bemdeclData, 'utf8').then(function() {
                        cache.cacheFileInfo('source-file', sourcePath);
                        cache.cacheFileInfo('target-file', targetPath);
                        _this.node.resolveTarget(target);
                    });
                });
            } else {
                _this.node.getLogger().isValid(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});

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