function TargetList(targets) {
    this._targets = targets;
}

TargetList.prototype = {
    getTargets: function() {
        return this._targets;
    },
    addTarget: function(target) {
        this._targets.push(target);
    },
    addTargets: function(targets) {
        this._targets = this._targets.concat(target);
    }
};

module.exports = TargetList;