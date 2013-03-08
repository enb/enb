function TechList(func) {
    this._func = func;
}

TechList.prototype = {
    getTechs: function() {
        return this._func();
    }
}

module.exports = TechList;