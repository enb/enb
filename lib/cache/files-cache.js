(function() {
  var Cache, FilesCache,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Cache = require('./cache');

  FilesCache = (function(_super) {
    var buildIndex;

    __extends(FilesCache, _super);

    function FilesCache() {
      return FilesCache.__super__.constructor.apply(this, arguments);
    }

    buildIndex = function(files) {
      var file, index, _i, _len;
      index = {};
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        index[file.fullname] = file.mtime;
      }
      return index;
    };

    FilesCache.prototype.isValid = function(newValue) {
      var file, index, _i, _len;
      index = buildIndex(this.value || []);
      for (_i = 0, _len = newValue.length; _i < _len; _i++) {
        file = newValue[_i];
        if (file.mtime !== index[file.fullname]) {
          return false;
        }
      }
      return true;
    };

    return FilesCache;

  })(Cache);

  module.exports = FilesCache;

}).call(this);
