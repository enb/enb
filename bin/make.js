var path = require('path'),
    cdir = process.cwd(),
    MakePlatform = require('../lib/make'),
    makePlatform = new MakePlatform();

makePlatform.init(cdir).then((function() {
    return makePlatform.build(process.argv[2])
}), function(err) {
  return console.log(err);
});

