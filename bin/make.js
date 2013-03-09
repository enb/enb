var path = require('path'),
    cdir = process.cwd(),
    MakePlatform = require('../lib/make'),
    makePlatform = new MakePlatform(),
    argv = require('optimist')
        .boolean('cache')
        .default({cache: true})
        .argv;

makePlatform.init(cdir).then((function() {
    if (!argv['cache']) {
        makePlatform.dropCache();
    }
    return makePlatform.build(argv._.map(function(s) { return s.toString(); }))
})).then(null, function(err) {
    console.error(err.stack);
    process.exit(1);
});