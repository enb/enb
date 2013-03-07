function FileList() {
    this.items = [];
    this.bySuffix = {};
}

FileList.prototype = {
    addFiles: function(files) {
        for (var i = 0, l = files.length; i < l; i++) {
            var file = files[i];
            this.items.push(file);
            (this.bySuffix[file.suffix] || (this.bySuffix[file.suffix] = [])).push(file)
        }
    },

    getBySuffix: function(suffix) {
        if (Array.isArray(suffix)) {
            var res = [], items = this.items;
            for (var i = 0, l = items.length; i < l; i++) {
                if (suffix.indexOf(items[i].suffix) != -1) {
                    res.push(items[i]);
                }
            }
            return res;
        } else {
            return this.bySuffix[suffix] || [];
        }
    }
};

module.exports = FileList;