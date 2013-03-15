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
        opts = opts || {};
        var env = {},
            specifiedEnv = opts.env || {},
            baseEnv = this._makePlatform.getEnv() || {};

        Object.keys(baseEnv).forEach(function(key) {
            env[key] = baseEnv[key];
        });
        Object.keys(specifiedEnv).forEach(function(key) {
            env[key] = specifiedEnv[key];
        });
        opts.env = env;

        this.log('$ ' + shellCmd);

        var shellProcess = childProcess.exec(shellCmd, opts),
            promise = Vow.promise(),
            stdout = '',
            stderr = '';

        shellProcess.on('exit', function(code) {
            if (code === 0) return promise.fulfill([stdout, stderr]);
            promise.reject(new Error(stderr));
        });

        shellProcess.stderr.on('data', function(data) {
            stderr += data;
            console.log(data.trim());
        });

        shellProcess.stdout.on('data', function(data) {
            console.log(data.trim());
            stdout += data;
        });

        return promise;
    }
});