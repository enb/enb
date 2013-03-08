var emptyFn = function() {},
    keys = Object.keys,
    hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(o1, o2) {
    for(var i in o2) {
        hasOwnProperty.call(o2, i) && (o1[i] = o2[i]);
    }

    return o1;
}

function isFunction(o) {
    return typeof o === 'function';
}

function override(base, res, add) {

    keys(add).forEach(function(name) {
        var prop = add[name];
        if(isFunction(prop) && prop.toString().indexOf('.__base') > -1) {
            var baseMethod = base[name] || emptyFn;
            res[name] = function() {
                var _this = this,
                    baseSaved = _this.__base;

                _this.__base = baseMethod;
                var res = prop.apply(_this, arguments);
                _this.__base = baseSaved;
                return res;
            };
        }
        else {
            res[name] = prop;
        }
    });

}

module.exports = function() {

    var hasBase = isFunction(arguments[0]),
        base = hasBase? arguments[0] : emptyFn,
        props = arguments[hasBase? 1 : 0] || {},
        staticProps = arguments[hasBase? 2 : 1],
        res = props.__constructor || (hasBase && base.prototype.__constructor)?
            function() {
                return this.__constructor.apply(this, arguments);
            } :
            function() {};

    if(!hasBase) {
        return extend((res.prototype = props).__self = res, staticProps);
    }

    extend(res, base).prototype = Object.create(base.prototype, { constructor : res });

    override(base.prototype, (res.prototype.__self = res).prototype, props);
    staticProps && override(base, res, staticProps);

    return res;

};
