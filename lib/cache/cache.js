var fs = require('fs');

function Cache(filename) {
  this.filename = filename;
  this.value = null;
}

Cache.prototype.load = function() {
  return this.value = require(this.filename);
};

Cache.prototype.save = function() {
  return fs.writeFileSync(this.filename, 'module.exports = ' + JSON.stringify(this.value) + ';', 'utf8');
};

Cache.prototype.isValid = function(newValue) {
  return this.value === newValue;
};

Cache.prototype.getValue = function() {
  return this.value;
};

Cache.prototype.setValue = function(value) {
  return this.value = value;
};

module.exports = Cache;
