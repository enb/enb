var inherit = require('inherit'),
    childProcess = require('child_process'),
    Vow = require('vow');

module.exports = inherit(require('./configurable'), {
    __constructor: function(name) {
        this.__base();
        this._name = name;
        this._makePlatform = null;
        this._logger = null;
    },
    getMakePlatform: function() {
        return this._makePlatform;
    },
    setMakePlatform: function(makePlatform) {
        this._makePlatform = makePlatform;
        this._logger = makePlatform.getLogger().subLogger(':' + this._name);
    },
    log: function(msg) {
        this._logger.log(msg);
    },
    buildTargets: function(targets) {
        return this._makePlatform.buildTargets(targets);
    },
    buildTarget: function(target) {
        return this.buildTargets([target]);
    },
    cleanTargets: function(targets) {
        return this._makePlatform.cleanTargets(targets);
    },
    cleanTarget: function(target) {
        return this.cleanTargets([target]);
    },
    shell: function(shellCmd, opts) {
        var _this = this, promise = Vow.promise();
        childProcess.exec(shellCmd, opts, function(err, stdout, stderr) {
            if (err) {
                promise.reject(err);
            }
            _this.log('$ ' + shellCmd + '\n' + stdout.trim());
            promise.fulfill([err, stdout, stderr]);
        });
        return promise;
    }
});