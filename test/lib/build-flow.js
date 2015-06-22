require('chai')
    .use(require('chai-as-promised'))
    .should();

var path = require('path');
var fs = require('fs');
var inherit = require('inherit');
var mockFs = require('mock-fs');
var framework = require('../../lib/build-flow');
var BaseTech = require('../../lib/tech/base-tech');
var FileList = require('../../lib/file-list');
var MockNode = require('mock-enb/lib/mock-node');
var EOL = require('os').EOL;

describe('build-flow', function () {
    var flow;

    beforeEach(function () {
        flow = framework.create();
    });

    describe('errors', function () {
        it('should throw error if name is not specified', function () {
            (function () {
                flow.createTech();
            }).should.throw('You should declare tech name using "name" method of BuildFlow.');
        });

        it('should throw error if target is not specified', function () {
            (function () {
                flow
                    .name('name')
                    .createTech();
            }).should.throw('You should declare tech target name using "target" method of BuildFlow.');
        });
    });

    describe('dummy', function () {
        it('should create instance of BaseTech', function () {
            var Tech = flow
                .name('name')
                .target('target', 'file.ext')
                .createTech();

            var tech = new Tech();

            tech.should.instanceOf(BaseTech);
        });

        it('should create tech with specified name', function () {
            var Tech = flow
                .name('name')
                .target('target', 'file.ext')
                .createTech();

            var tech = new Tech();

            tech.getName().should.be.equal('name');
        });

        it('should create tech with specified target', function () {
            var Tech = flow
                .name('name')
                .target('target', 'file.ext')
                .createTech();

            var tech = init(Tech);

            tech.getTargets().should.be.deep.equal(['file.ext']);
        });

        it('should support target mask', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .createTech();

            var bundle = new MockNode('bundle');
            var tech = init(bundle, Tech);

            tech.getTargets().should.be.deep.equal(['bundle.ext']);
        });
    });

    describe('build', function () {
        var target = 'bundle.ext';
        var dir = 'bundle';
        var bundle;

        beforeEach(function () {
            bundle = new MockNode(dir);

            mockFs({
                bundle: {}
            });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('should throw error if builder method not defined', function () {
            var Tech = flow
                .name('name')
                .target('target', target)
                .createTech();

            return init(bundle, Tech)
                .build()
                .should.be.rejectedWith('You should declare build function using "build" method of BuildFlow.');
        });

        it('should write result to file', function () {
            var Tech = flow
                .name('name')
                .target('target', target)
                .builder(function () {
                    return 'Hello World!';
                })
                .createTech();

            var tech = init(bundle, Tech);

            return tech.build()
                .then(function () {
                    var filename = path.resolve(dir, target);
                    var contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal('Hello World!');
                });
        });

        it('should wrap result', function () {
            var Tech = flow
                .name('name')
                .target('target', target)
                .wrapper(function (str) {
                    return '<div>' + str + '</div>';
                })
                .builder(function () {
                    return 'Hello World!';
                })
                .createTech();

            var tech = init(bundle, Tech);

            return tech.build()
                .then(function () {
                    var filename = path.resolve(dir, target);
                    var contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal('<div>Hello World!</div>');
                });
        });

        it('should redefine save method', function () {
            var filename = path.resolve('file.ext');
            var Tech = flow
                .name('name')
                .target('target', target)
                .saver(function (target, str) {
                    return fs.writeFileSync(filename, str);
                })
                .builder(function () {
                    return 'Hello World!';
                })
                .createTech();

            var tech = init(bundle, Tech);

            return tech.build()
                .then(function () {
                    var contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal('Hello World!');
                });
        });

        it('should prepare build', function () {
            var data = 'Hello world';
            var dataFilename = path.resolve('data.txt');
            var Tech = flow
                .name('name')
                .target('target', target)
                .prepare(function () {
                    this._someData = fs.readFileSync(dataFilename, 'utf-8');
                })
                .builder(function () {
                    return this._someData;
                })
                .createTech();

            var tech = init(bundle, Tech);

            fs.writeFileSync(dataFilename, data);

            return tech.build()
                .then(function () {
                    var filename = path.resolve(dir, target);
                    var contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal(data);
                });
        });

        it('should have node in builder', function () {
            var actual = null;
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .builder(function () {
                    actual = this.node;
                })
                .createTech();

            var tech = init(bundle, Tech);

            return tech.build()
                .then(function () {
                    actual.should.be.equal(bundle);
                });
        });
    });

    describe('options', function () {
        describe('required', function () {
            it('should throw error if value is not specified', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineRequiredOption('opt')
                    .createTech();

                (function () {
                    init(Tech);
                }).should.throw('Option "opt" is required for technology "name".');
            });

            it('should provide specified value', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineRequiredOption('opt')
                    .createTech();

                var tech = init(Tech, { opt: 'value' });

                tech._opt.should.be.equal('value');
            });

            it('should provide value to specified field', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineRequiredOption('opt', 'field')
                    .createTech();

                var tech = init(Tech, { opt: 'value' });

                tech.field.should.be.equal('value');
            });
        });

        describe('not required', function () {
            it('should provide default value', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                var tech = init(Tech);

                tech._opt.should.be.equal('value');
            });

            it('should provide specified value', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                var tech = init(Tech, { opt: 'value2' });

                tech._opt.should.be.equal('value2');
            });

            it('should provide value to specified field', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt', 'value', 'field')
                    .createTech();

                var tech = init(Tech);

                tech.field.should.be.equal('value');
            });
        });

        describe('aliases', function () {
            it('should provide value from option with alias name', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt')
                    .optionAlias('opt', 'alias')
                    .createTech();

                var tech = init(Tech, { alias: 'value' });

                tech._opt.should.be.equal('value');
            });
        });
    });

    describe('FileList', function () {
        var file1;
        var file2;
        var files;

        before(function () {
            file1 = {
                fullname: path.resolve('file1.ext1'),
                name: 'file1.ext1',
                suffix: 'ext1'
            };
            file2 = {
                fullname: path.resolve('file2.ext2'),
                name: 'file2.ext2',
                suffix: 'ext2'
            };
            files = [file1, file2];
        });

        describe('files', function () {
            it('should expect FileList from `?.files` target', function () {
                var list = new FileList();
                var bundle = new MockNode('bundle');

                list.addFiles(files);
                bundle.provideTechData('?.files', list);

                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext1', 'ext2'])
                    .createTech();

                return build(bundle, Tech)
                    .should.become(files);
            });

            it('should add `filesTarget` option', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext'])
                    .createTech();

                var tech = init(Tech, { filesTarget: 'target.ext' });

                tech._filesTarget.should.be.equal('target.ext');
            });

            it('should filter files by suffixes', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext2'])
                    .createTech();

                return build(Tech)
                    .should.become([file2]);
            });

            it('should add `sourceSuffixes` option', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext2'])
                    .createTech();

                return build(Tech, { sourceSuffixes: ['ext1'] })
                    .should.become([file1]);
            });
        });

        describe('dirs', function () {
            it('should expect FileList from `?.dirs` target', function () {
                var list = new FileList();
                var bundle = new MockNode('bundle');

                list.addFiles(files);

                bundle.provideTechData('?.dirs', list);

                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext1', 'ext2'])
                    .createTech();

                return build(bundle, Tech)
                    .should.become(files);
            });

            it('should add `dirsTarget` option', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext'])
                    .createTech();

                var tech = init(Tech, { dirsTarget: 'target' });

                tech._dirsTarget.should.be.equal('target');
            });

            it('should filter files by suffixes', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext2'])
                    .createTech();

                return build(Tech)
                    .should.become([file2]);
            });

            it('should add `sourceDirSuffixes` option', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext2'])
                    .createTech();

                return build(Tech, { sourceDirSuffixes: ['ext1'] })
                    .should.become([file1]);
            });
        });

        function build(node, Tech, opts) {
            if (!(node instanceof MockNode)) {
                var list = new FileList();

                opts = Tech;
                Tech = node;
                node = new MockNode('node');

                list.addFiles(files);

                node.provideTechData('?.files', list);
                node.provideTechData('?.dirs', list);
            }

            var actual;
            var SafeTech = Tech.buildFlow()
                .saver(function () {})
                .builder(function (files) {
                    actual = files;
                })
                .createTech();

            return node.runTech(SafeTech, opts)
                .then(function () {
                    return actual;
                });
        }
    });

    describe('dependencies', function () {
        var dir;
        var basename;

        before(function () {
            dir = 'bundle';
            basename = '.dependants';
        });

        beforeEach(function () {
            mockFs({
                bundle: {}
            });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('should require source from its node', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .dependOn('dependence', basename)
                .builder(function () {})
                .createTech();

            return build(Tech)
                .then(function (requires) {
                    requires.should.be.contain(basename);
                });
        });

        it('should require source from its node and provide filename', function () {
            var actual = '';

            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceFilename('dependence', basename)
                .builder(function (filename) {
                    actual = filename;
                })
                .createTech();

            return build(Tech)
                .then(function (requires) {
                    var expected = path.resolve(dir, basename);

                    requires.should.be.contain('.dependants');
                    actual.should.be.equal(expected);
                });
        });

        it('should require sources from its node and provide filenames', function () {
            var actual = [];

            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceListFilenames('dependencies', ['.dep1', '.dep2'])
                .builder(function (filenames) {
                    actual = filenames;
                })
                .createTech();

            return build(Tech)
                .then(function (requires) {
                    requires.should.be.contain('.dep1');
                    requires.should.be.contain('.dep2');

                    actual.should.be.deep.equal([
                        path.resolve(dir, '.dep1'),
                        path.resolve(dir, '.dep2')
                    ]);
                });
        });

        it('should require source from its node and provide contents', function () {
            var actual = '';
            var dirname = path.resolve(dir);
            var filename = path.join(dirname, basename);

            fs.writeFileSync(filename, 'Hello World!');

            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceText('dependencies', '.dependants')
                .builder(function (contents) {
                    actual = contents;
                })
                .createTech();

            return build(Tech)
                .then(function (requires) {
                    requires.should.be.contain('.dependants');

                    actual.should.be.equal('Hello World!');
                });
        });

        it('should require source from its node and provide data', function () {
            var actual = {};
            var expected = { data: true };

            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceResult('dependencies', basename)
                .builder(function (data) {
                    actual = data;
                })
                .createTech();

            return build(Tech, { '.dependants': expected })
                .then(function () {
                    actual.should.be.deep.equal(expected);
                });
        });

        function build(Tech, data) {
            var requires = [];
            var MyMockNode = inherit(MockNode, {
                requireSources: function (sources) {
                    requires = [].concat(requires, sources);

                    return this.__base(sources);
                }
            });
            var bundle = new MyMockNode(dir);

            if (data) {
                Object.keys(data).forEach(function (key) {
                    bundle.provideTechData(key, data[key]);
                });
            }

            return bundle.runTech(Tech)
                .then(function () {
                    return requires;
                });
        }
    });

    describe('deprecated', function () {
        beforeEach(function () {
            mockFs({
                bundle: {}
            });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('should warn about deprecated tech in current package', function () {
            var bundle = new MockNode('bundle');
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package')
                .builder(function () {})
                .createTech();

            return bundle.runTech(Tech)
                .then(function () {
                    var logger = bundle.getLogger();
                    var messages = logger._messages;

                    messages.should.be.contains({
                        message: 'Tech old-package/techs/name is deprecated.',
                        scope: path.join('bundle', 'bundle.ext'),
                        action: '[deprecated]'
                    });
                });
        });

        it('should warn about deprecated tech and point to new package', function () {
            var bundle = new MockNode('bundle');
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package', 'new-package')
                .builder(function () {})
                .createTech();

            return bundle.runTech(Tech)
                .then(function () {
                    var logger = bundle.getLogger();
                    var messages = logger._messages;

                    messages.should.be.contains({
                        message: 'Tech old-package/techs/name is deprecated. ' +
                            'Install package new-package and use tech new-package/techs/name instead.',
                        scope: path.join('bundle', 'bundle.ext'),
                        action: '[deprecated]'
                    });
                });
        });

        it('should warn about deprecated tech and point to new tech', function () {
            var bundle = new MockNode('bundle');
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package', 'new-package', 'new-tech')
                .builder(function () {})
                .createTech();

            return bundle.runTech(Tech)
                .then(function () {
                    var logger = bundle.getLogger();
                    var messages = logger._messages;

                    messages.should.be.contains({
                        message: 'Tech old-package/techs/name is deprecated. ' +
                            'Install package new-package and use tech new-package/techs/new-tech instead.',
                        scope: path.join('bundle', 'bundle.ext'),
                        action: '[deprecated]'
                    });
                });
        });

        it('should warn about deprecated tech and write description', function () {
            var bundle = new MockNode('bundle');
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package', 'new-package', 'new-tech', ' The Description.')
                .builder(function () {})
                .createTech();

            return bundle.runTech(Tech)
                .then(function () {
                    var logger = bundle.getLogger();
                    var messages = logger._messages;

                    messages.should.be.contains({
                        message: 'Tech old-package/techs/name is deprecated. ' +
                            'Install package new-package and use tech new-package/techs/new-tech instead. ' +
                            'The Description.',
                        scope: path.join('bundle', 'bundle.ext'),
                        action: '[deprecated]'
                    });
                });
        });
    });

    describe('helpers', function () {
        var dir = 'files';
        var filename1 = path.join(dir, 'file-1.ext');
        var filename2 = path.join(dir, 'file-2.ext');
        var contents1 = 'one';
        var contents2 = 'two';

        beforeEach(function () {
            mockFs({
                files: {
                    'file-1.ext': contents1,
                    'file-2.ext': contents2
                },
                bundle: {
                    'target-1.ext': contents1,
                    'target-2.ext': contents2
                }
            });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('should join files', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useFileList(['ext'])
                .justJoinFiles()
                .createTech();

            return build(Tech)
                .should.become([
                    contents1,
                    contents2
                ].join(EOL));
        });

        it('should join files with comments', function () {
            var path1 = path.join('..', filename1);
            var path2 = path.join('..', filename2);
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useFileList(['ext'])
                .justJoinFilesWithComments()
                .createTech();

            return build(Tech)
                .should.become([
                    '/* begin: ' + path1 + ' */',
                    contents1,
                    '/* end: ' + path1 + ' */',
                    '/* begin: ' + path2 + ' */',
                    contents2,
                    '/* end: ' + path2 + ' */'
                ].join(EOL));
        });

        it('should join files with specified wrapper', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useFileList(['ext'])
                .justJoinFiles(function (filename, contents) {
                    return [filename, contents].join(': ');
                })
                .createTech();

            return build(Tech)
                .should.become([
                    filename1 + ': ' + contents1,
                    filename2 + ': ' + contents2
                ].join(EOL));
        });

        it('should join sources', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceText('source-one', 'target-1.ext')
                .useSourceText('source-two', 'target-2.ext')
                .justJoinSources()
                .createTech();

            return build(Tech)
                .should.become([
                    contents1,
                    contents2
                ].join(EOL));
        });

        function build(Tech) {
            var bundle = new MockNode('bundle');
            var list = new FileList();

            list.loadFromDirSync(dir);
            bundle.provideTechData('?.files', list);

            return bundle.runTechAndGetContent(Tech)
                .spread(function (res) {
                    return res;
                });
        }
    });
});

function init(node, Tech, opts) {
    if (!(node instanceof MockNode)) {
        opts = Tech;
        Tech = node;
        node = new MockNode('node');
    }

    var tech = new Tech(opts);

    tech.init(node);

    return tech;
}
