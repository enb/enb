module.exports = {
    merge: function(depsToMerge) {
        depsToMerge = [].concat(depsToMerge);
        var startingDep = depsToMerge.shift(),
            index = buildDepsIndex(startingDep),
            result = [].concat(startingDep),
            currentDep, dep, key;
        while (currentDep = depsToMerge.shift()) {
            for (var i = 0, l = currentDep.length; i < l; i++) {
                dep = currentDep[i];
                key = depKey(dep);
                if (!index[key]) {
                    result.push(dep);
                    index[key] = true;
                }
            }
        }
        return result;
    }
    // TODO: substract
};

function depKey(dep) {
   return dep.block + (dep.elem ? '__' + dep.elem : '') + (dep.mod ? '_' + dep.mod + '_' + dep.val : '');
}

function buildDepsIndex(deps) {
    var result = {};
    for (var i = 0, l = deps.length; i < l; i++) {
        result[depKey(deps[i])] = true;
    }
    return result;
}