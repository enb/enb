var path = require('path'),
    cdir = process.cwd(),
    MakePlatform = require('../make'),
    makePlatform = new MakePlatform();

module.exports = function(program) {
    program.command('make')
        .option('-n, --no-cache', 'drop cache before running make')
        .description('build specified targets')
        .action(function() {
            var args = program.args.slice(0),
                cmd = args.pop();
            makePlatform.init(cdir).then((function() {
                if (cmd.cache) {
                    makePlatform.loadCache();
                }
                return makePlatform.build(args).then(function() {
                    makePlatform.saveCache();
                    return makePlatform.destruct();
                });
            })).then(null, function(err) {
                console.error(err.stack);
                process.exit(1);
            });
        });
};