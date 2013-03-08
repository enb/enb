var inherit = require('inherit'),
    Vow = require('vow'),
    fs = require('fs');

var FileAssembleTech = inherit({
    getName: function() {
        throw new Error('You are required to override getName method of FileAssembleTech.')
    },
    init: function(node) {
        this.node = node;
    },
    getDestSuffixes: function() {
        throw new Error('You are required to override getDestSuffixes method of FileAssembleTech.')
    },
    getSourceSuffixes: function() {
        throw new Error('You are required to override getSourceSuffixes method of FileAssembleTech.')
    },
    getTargets: function() {
        var _this = this;
        return this.getDestSuffixes().map(function(suffix) {
            return _this.node.getTargetName(suffix);
        });
    },
    isRebuildRequired: function(suffix) {
        var target = this.node.getTargetName(suffix);
        return this.node.getNodeCache(target).needRebuildFile('file', this.node.resolvePath(target));
    },
    buildResultCached: function(sourceFiles, suffix) {
        var target = this.node.getTargetName(suffix),
            cache = this.node.getNodeCache(target),
            _this = this;
        if (this.isRebuildRequired(suffix) || cache.needRebuildFileList('file-list', sourceFiles)) {
            return Vow.when(this.buildResult(sourceFiles, suffix))
                .then(function() {
                    cache.cacheFileInfo('file', _this.node.resolvePath(target));
                    cache.cacheFileList('file-list', sourceFiles);
                    _this.node.resolveTarget(target);
                });
        } else {
            _this.node.getLogger().isValid(target);
            _this.node.resolveTarget(target);
            return Vow.fulfill();
        }
    },
    buildResult: function(sourceFiles, suffix) {
        var _this = this;
        try {
            return Vow.when(this.getBuildResult(sourceFiles, suffix))
                .then(function(content) {
                    return _this.writeFile(_this.node.resolvePath(_this.node.getTargetName(suffix)), content);
                });
        } catch (err) {
            return Vow.reject(err);
        }
    },
    getBuildResult: function(sourceFiles, suffix) {
        throw new Error('You are required to override getBuildResult method of FileAssembleTech.')
    },
    buildResults: function(sourceFiles, suffixes) {
        var _this = this;
        return Vow.all(suffixes.map(function(suffix) {
            return _this.buildResultCached(sourceFiles, suffix);
        }));
    },
    writeFile: function(filename, content) {
        var promise = Vow.promise();
        fs.writeFile(filename, content, "utf8", function(err) {
            if (err) {
                return promise.reject(err);
            }
            promise.fulfill();
        });
        return promise;
    },
    build: function() {
        var _this = this;
        return this.node.requireSources([this.node.getTargetName('files')]).spread(function(files) {
            var sourceFiles = files.getBySuffix(_this.getSourceSuffixes());
            return Vow.when(_this.getDestSuffixes()).then(function(suffixes) {
                return _this.buildResults(sourceFiles, suffixes);
            });
        });
    },
    clean: function() {
        var _this = this;
        return Vow.when(_this.getDestSuffixes()).then(function(suffixes) {
            suffixes.forEach(function(suffix) {
                _this.cleanTarget(_this.node.getTargetName(suffix));
            });
        });
    },
    cleanTarget: function(target) {
        var targetPath = this.node.resolvePath(target);
        if (fs.existsSync(targetPath)) {
            fs.unlinkSync(this.node.resolvePath(target));
            this.node.getLogger().logClean(target);
        }
    }
});

module.exports = FileAssembleTech;