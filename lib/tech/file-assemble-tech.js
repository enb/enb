var inherit = require('inherit'),
    Vow = require('vow'),
    fs = require('fs'),
    vowFs = require('vow-fs');

var FileAssembleTech = inherit(require('./base-tech'), {
    getDestSuffixes: function() {
        throw new Error('You are required to override getDestSuffixes method of FileAssembleTech.')
    },
    getSourceSuffixes: function() {
        throw new Error('You are required to override getSourceSuffixes method of FileAssembleTech.')
    },
    getTargetName: function(suffix) {
        return this.node.getTargetName(suffix);
    },
    getTargets: function() {
        var _this = this;
        return this.getDestSuffixes().map(function(suffix) {
            return _this.getTargetName(suffix);
        });
    },
    isRebuildRequired: function(suffix) {
        var target = this.getTargetName(suffix);
        return this.node.getNodeCache(target).needRebuildFile('file', this.node.resolvePath(target));
    },
    buildResultCached: function(sourceFiles, suffix) {
        var target = this.getTargetName(suffix),
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
                    return vowFs.write(_this.node.resolvePath(_this.getTargetName(suffix)), content, 'utf8');
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
            var sourceSuffixes = _this.getSourceSuffixes() || [],
                sourceFiles = sourceSuffixes.length ? files.getBySuffix(sourceSuffixes) : [];
            return Vow.when(_this.getDestSuffixes()).then(function(suffixes) {
                return _this.buildResults(sourceFiles, suffixes);
            });
        });
    }
});

module.exports = FileAssembleTech;