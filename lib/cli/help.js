/**
 * CLI/help
 * ========
 *
 * Этот файл отображает документацию.
 */
var path = require('path'),
    cdir = process.cwd(),
    Server = require('../server/server'),
    Vow = require('vow');

module.exports = function(program) {
    program.command('help')
        .description('displays help about techs')
        .action(function() {
            var args = program.args.slice(0),
                cmd = args.pop();
            var filename = args.shift();
            if (!filename) {
                console.log('Filename is not specified');
                return;
            }
            filename = require.resolve(filename);
            shell('sh', ['-c', 'node ' + path.resolve(__dirname, '../../node_modules/madify/bin/madify')
                + ' "' + filename + '" | '
                + path.resolve(__dirname, '../../node_modules/mad/bin/mad') + ' -'],
                function() {
                    process.exit(0);
                }
            );
        });
};

var spawn = require('child_process').spawn;
function shell(cmd, opts, callback) {
     var p;
     process.stdin.pause();
     process.stdin.setRawMode(false);
     p = spawn(cmd, opts, {
         customFds: [0, 1, 2]
     });
     return p.on('exit', function() {
         process.stdin.setRawMode(true);
         process.stdin.resume();
         callback && callback();
     });
}
