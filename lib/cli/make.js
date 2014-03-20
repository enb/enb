/**
 * CLI/make
 * ========
 *
 * Этот файл запускает сборку из командной строки.
 */
var MakePlatform = require('../make');
var makePlatform = new MakePlatform();
var path = require('path');

module.exports = function (program) {
    program.command('make')
        .option('-n, --no-cache', 'drop cache before running make')
        .option('-d, --dir <dir>', 'custom project root', process.cwd())
        .option('--graph', 'draws build graph')
        .description('build specified targets')
        .action(function () {
            var args = program.args.slice(0);
            var cmd = args.pop();
            makePlatform.init(path.resolve(cmd.dir)).then((function () {
                if (cmd.cache) {
                    makePlatform.loadCache();
                }
                return makePlatform.build(args).then(function () {
                    if (cmd.graph) {
                        console.log(makePlatform.getBuildGraph().render());
                    }
                    makePlatform.saveCache();
                    return makePlatform.destruct();
                });
            }))
            .then(null, function (err) {
                if (cmd.graph) {
                    console.log(makePlatform.getBuildGraph().render());
                }
                console.error(err.stack);
                process.exit(1);
            });
        });
};
