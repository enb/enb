// TODO: Нужен ли этот класс?
function Env(values) {
    this._values = values;
}

Env.prototype = {
    getValue: function(name, defaultValue) {
        return this._values.hasOwnProperty(name) ? this._values[name] : defaultValue;
    }
};