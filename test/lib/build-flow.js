var path = require('path');
var fs = require('fs');
var inherit = require('inherit');
var mockFs = require('mock-fs');
var deasync = require('deasync');
var proxyquire = require('proxyquire').noCallThru();
var loadDirSync = require('mock-enb/utils/dir-utils').loadDirSync;
var framework = require('../../lib/build-flow');
var BaseTech = require('../../lib/tech/base-tech');
var FileList = require('../../lib/file-list');
var MockNode = proxyquire('mock-enb/lib/mock-node', {
    enb: require('../../lib/api'),
    'enb/lib/cache/cache-storage': require('../../lib/cache/cache-storage'),
    'enb/lib/cache/cache': require('../../lib/cache/cache')
});
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

        it('should throw error if target not specified', function () {
            var Tech = flow
                .name('name')
                .target('target')
                .createTech();

            var bundle = new MockNode('bundle');

            (function () {
                init(bundle, Tech);
            }).should.throw('Option "target" is required for technology "name".');
        });

        it('should create tech with default target value', function () {
            var Tech = flow
                .name('name')
                .target('target', 'file.ext')
                .createTech();

            var tech = init(Tech);

            tech.getTargets().should.be.deep.equal(['file.ext']);
        });

        it('should create tech with specified target', function () {
            var Tech = flow
                .name('name')
                .target('target')
                .createTech();

            var tech = init(Tech, { target: 'file.ext' });

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
                .saver(function (targetPath, str) {
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

            it('should support several aliases', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt1')
                    .defineOption('opt2')
                    .optionAlias('opt1', 'alias1')
                    .optionAlias('opt2', 'alias2')
                    .createTech();

                var tech = init(Tech, { alias1: 'value1', alias2: 'value2' });

                tech._opt1.should.be.equal('value1');
                tech._opt2.should.be.equal('value2');
            });
        });

        describe('target', function () {
            it('should support option mask for target', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '{opt}.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                var bundle = new MockNode('bundle');
                var tech = init(bundle, Tech);

                tech.getTargets().should.be.deep.equal(['value.ext']);
            });

            it('should remove `{opt}` if option is not specified', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '{opt}.ext')
                    .createTech();

                var bundle = new MockNode('bundle');
                var tech = init(bundle, Tech);

                tech.getTargets().should.be.deep.equal(['.ext']);
            });

            it('should remove `{opt}` if option has no default value', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '{opt}.ext')
                    .defineOption('opt')
                    .createTech();

                var bundle = new MockNode('bundle');
                var tech = init(bundle, Tech);

                tech.getTargets().should.be.deep.equal(['.ext']);
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

            it('should support suffix as string', function () {
                var list = new FileList();
                var bundle = new MockNode('bundle');

                list.addFiles(files);
                bundle.provideTechData('?.files', list);

                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList('ext1')
                    .createTech();

                return build(Tech)
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

            it('should support suffix as string', function () {
                var Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList('ext1')
                    .createTech();

                return build(Tech)
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
                .builder(function (sourceFiles) {
                    actual = sourceFiles;
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
                requireSources(sources) {
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

                    messages.should.be.deep.contains({
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

                    messages.should.be.deep.contains({
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

                    messages.should.be.deep.contains({
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

                    messages.should.be.deep.contains({
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

        it('should join empty string', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .justJoinFiles()
                .createTech();

            return build(Tech)
                .should.become('');
        });

        it('should ingore source result', function () {
            var bundle = new MockNode('bundle');
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceResult('dependence', '.dependants')
                .justJoinFiles()
                .createTech();

            bundle.provideTechData('.dependants', { data: true });

            return build(bundle, Tech)
                .should.become('');
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

        it('should join source files', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceFilename('source-one', 'target-1.ext')
                .useSourceFilename('source-two', 'target-2.ext')
                .justJoinFiles()
                .createTech();

            return build(Tech)
                .should.become([
                    contents1,
                    contents2
                ].join(EOL));
        });

        it('should join source files with specified wrapper', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceFilename('source-one', 'target-1.ext')
                .useSourceFilename('source-two', 'target-2.ext')
                .justJoinFiles(function (filename, contents) {
                    return [filename, contents].join(': ');
                })
                .createTech();

            return build(Tech)
                .should.become([
                    path.resolve('bundle', 'target-1.ext') + ': ' + contents1,
                    path.resolve('bundle', 'target-2.ext') + ': ' + contents2
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

        it('should join files if use `justJoinSources`', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useFileList(['ext'])
                .justJoinSources()
                .createTech();

            return build(Tech)
                .should.become([
                    contents1,
                    contents2
                ].join(EOL));
        });

        it('should ignore source result if use `justJoinSources`', function () {
            var bundle = new MockNode('bundle');
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceResult('dependence', '.dependants')
                .justJoinSources()
                .createTech();

            bundle.provideTechData('.dependants', { data: true });

            return build(Tech)
                .should.become('');
        });

        function build(node, Tech) {
            if (!(node instanceof MockNode)) {
                Tech = node;
                node = new MockNode('bundle');
            }

            var list = new FileList();

            list.addFiles(loadDirSync(dir));
            node.provideTechData('?.files', list);

            return node.runTechAndGetContent(Tech)
                .spread(function (res) {
                    return res;
                });
        }
    });

    describe('inheritance', function () {
        beforeEach(function () {
            mockFs({
                bundle: {}
            });
        });

        afterEach(function () {
            mockFs.restore();
        });

        describe('base', function () {
            it('should inherit tech', function () {
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .createTech();

                var tech1 = new Tech();
                var tech2 = new ChildTech();

                tech1.getName().should.be.equal(tech2.getName());
                tech1.getTargets().should.be.deep.equal(tech2.getTargets());
                tech1.build().should.be.deep.equal(tech2.build());
            });

            it('should inherit name', function () {
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .createTech();

                var tech = new ChildTech();

                tech.getName().should.be.equal('name');
            });

            it('should inherit target', function () {
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .createTech();

                var tech = init(ChildTech);

                tech.getTargets().should.be.deep.equal(['file.ext']);
            });

            it('should redefine name', function () {
                var Tech = flow
                    .name('old-name')
                    .target('target', 'file.ext')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .name('new-name')
                    .createTech();

                var tech = new ChildTech();

                tech.getName().should.be.equal('new-name');
            });

            it('should redefine target', function () {
                var Tech = flow
                    .name('name')
                    .target('target', 'old-file.ext')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .target('target', 'new-file.ext')
                    .createTech();

                var tech = init(ChildTech);

                tech.getTargets().should.be.deep.equal(['new-file.ext']);
            });
        });

        describe('options', function () {
            it('should inherit option', function () {
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .createTech();

                var tech = init(ChildTech);

                tech._opt.should.be.equal('value');
            });

            it('should redefine option', function () {
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .defineOption('opt', 'old-value')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .defineOption('opt', 'new-value')
                    .createTech();

                var tech = init(ChildTech);

                tech._opt.should.be.equal('new-value');
            });
        });

        describe('methods', function () {
            it('should inherit method', function () {
                var actual = '';
                var expected = 'Hello World!';
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .methods({
                        hello() {
                            return expected;
                        }
                    })
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = this.hello();
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal(expected);
                    });
            });

            it('should inherit methods that use other method', function () {
                var actual = '';
                var expected = 'Hello World!';
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .methods({
                        hello() {
                            return this.hi();
                        },
                        hi() {
                            return expected;
                        }
                    })
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = this.hello();
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal(expected);
                    });
            });

            it('should redefine method', function () {
                var actual = '';
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .methods({
                        hello() {
                            return 'Hello World!';
                        }
                    })
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = this.hello();
                    })
                    .methods({
                        hello() {
                            return 'Hi World!';
                        }
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal('Hi World!');
                    });
            });

            it('should inherit static method', function () {
                var actual = '';
                var expected = 'Hello World!';
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .staticMethods({
                        hello() {
                            return expected;
                        }
                    })
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = ChildTech.hello();
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal(expected);
                    });
            });

            it('should redefine static method', function () {
                var actual = '';
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .staticMethods({
                        hello() {
                            return 'Hello World!';
                        }
                    })
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = ChildTech.hello();
                    })
                    .staticMethods({
                        hello() {
                            return 'Hi World!';
                        }
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal('Hi World!');
                    });
            });
        });

        describe('super', function () {
            var MyBaseTech;
            var Tech;
            var bundle;
            beforeEach(function () {
                bundle = new MockNode('bundle');
                MyBaseTech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();
            });

            describe('builder', function () {
                beforeEach(function () {
                    Tech = MyBaseTech.buildFlow()
                        .builder(function () { return '42'; })
                        .createTech();
                });

                it('should call base builder by default', function () {
                    var ChildTech = Tech.buildFlow().createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['42']);
                });

                it('should allow to call base builder via __base property', function () {
                    var ChildTech = Tech.buildFlow()
                        .builder(function () {
                            return '!' + this.__base.apply(this, arguments);
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['!42']);
                });

                it('should be passed thru the child to the base builder', function () {
                    var ChildTech = Tech.buildFlow().createTech();
                    var GrandChildTech = ChildTech.buildFlow()
                        .builder(function () {
                            return '!' + this.__base.apply(this, arguments);
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(GrandChildTech)
                        .should.eventually.eql(['!42']);
                });
            });

            describe('methods', function () {
                function _thisHello() {
                    return this.hello();
                }
                beforeEach(function () {
                    Tech = MyBaseTech.buildFlow()
                        .builder(function () { return 'Definitely not forty two.'; })
                        .methods({
                            hello() { return 42; }
                        })
                        .createTech();
                });

                it('should call base method by default', function () {
                    var ChildTech = Tech.buildFlow()
                        .builder(_thisHello)
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['42']);
                });

                it('should allow to call base method via __base property', function () {
                    var ChildTech = Tech.buildFlow()
                        .builder(_thisHello)
                        .methods({
                            hello() {
                                return '!' + this.__base.apply(this, arguments);
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['!42']);
                });

                it('should be passed thru the child to the base method', function () {
                    var ChildTech = Tech.buildFlow()
                        .builder(_thisHello)
                        .createTech();
                    var GrandChildTech = ChildTech.buildFlow()
                        .methods({
                            hello() {
                                return '!' + this.__base.apply(this, arguments);
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(GrandChildTech)
                        .should.eventually.eql(['!42']);
                });
            });

            describe('static methods', function () {
                function _staticHello() {
                    return this.__self.hello();
                }
                beforeEach(function () {
                    Tech = MyBaseTech.buildFlow()
                        .builder(function () { return 'Definitely not forty two.'; })
                        .staticMethods({
                            hello() { return 42; }
                        })
                        .createTech();
                });

                it('should call base static method by default', function () {
                    var ChildTech = Tech.buildFlow()
                        .builder(_staticHello)
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['42']);
                });

                it('should allow to call base static method via __base property', function () {
                    var ChildTech = Tech.buildFlow()
                        .builder(_staticHello)
                        .staticMethods({
                            hello() {
                                return '!' + this.__base.apply(this, arguments);
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['!42']);
                });

                it('should be passed thru the child to the base static method', function () {
                    var ChildTech = Tech.buildFlow()
                        .builder(_staticHello)
                        .createTech();
                    var GrandChildTech = ChildTech.buildFlow()
                        .staticMethods({
                            hello() {
                                return '!' + this.__base.apply(this, arguments);
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(GrandChildTech)
                        .should.eventually.eql(['!42']);
                });
            });
        });

        describe('dependencies', function () {
            it('should inherit dependence', function () {
                var dir = 'bundle';
                var basename = '.dependants';
                var actual = '';
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useSourceFilename('dependence', basename)
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .builder(function (filename) {
                        actual = filename;
                    })
                    .createTech();

                var bundle = new MockNode(dir);

                return bundle.runTech(ChildTech)
                    .then(function () {
                        var expected = path.resolve(dir, basename);

                        actual.should.be.equal(expected);
                    });
            });

            it('should redefine dependence', function () {
                var dir = 'bundle';
                var actual = '';
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useSourceFilename('dependence', '.old-file.ext')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .useSourceFilename('dependence', 'new-file.ext')
                    .builder(function (filename) {
                        actual = filename;
                    })
                    .createTech();

                var bundle = new MockNode(dir);

                return bundle.runTech(ChildTech)
                    .then(function () {
                        var expected = path.resolve(dir, 'new-file.ext');

                        actual.should.be.equal(expected);
                    });
            });
        });

        describe('unuse', function () {
            it('should unuse other target', function () {
                var actual;
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useSourceFilename('dependence', '.old-file.ext')
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .unuseTarget('dependence')
                    .builder(function () {
                        actual = arguments.length;
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal(0);
                    });
            });

            it('should unuse other target with files', function () {
                var actual;
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useFileList(['ext'])
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .unuseFileList()
                    .builder(function () {
                        actual = arguments.length;
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal(0);
                    });
            });

            it('should unuse other target with dirs', function () {
                var actual;
                var Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useDirList(['ext'])
                    .createTech();

                var ChildTech = Tech.buildFlow()
                    .unuseDirList()
                    .builder(function () {
                        actual = arguments.length;
                    })
                    .createTech();

                var bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(function () {
                        actual.should.be.equal(0);
                    });
            });
        });
    });

    describe('cache', function () {
        var bundle;
        var helper;
        var target;
        var blocksDirname;
        var blockFilename;
        var blockDirname;
        var fileList;

        before(function () {
            target = 'file.ext';
            blocksDirname = path.resolve('blocks');
            blockFilename = path.join(blocksDirname, 'block.ext');
            blockDirname = path.join(blocksDirname, 'block.dir');
        });

        beforeEach(function () {
            mockFs({
                blocks: {
                    'block.dir': {
                        'block.ext': 'value'
                    },
                    'block.ext': 'value'
                },
                bundle: {
                    '.dependants': 'value',
                    '.dependants-1': 'value-1',
                    '.dependants-2': 'value-2'
                }
            });

            bundle = new MockNode('bundle');
            fileList = new FileList();
            helper = {
                change(target) {
                    var filename = _getFilename(target);

                    deasync.sleep(10);

                    fs.writeFileSync(filename, 'new-value');
                },
                fileInfo(target) {
                    var filename = _getFilename(target);
                    var basename = path.basename(target);
                    var mtime = fs.statSync(filename).mtime.getTime();

                    return {
                        name: basename,
                        fullname: filename,
                        mtime: mtime,
                        suffix: target.split('.').slice(1).join('.')
                    };
                },
                dirInfo(target) {
                    var dirname = _getFilename(target);
                    var basename = path.basename(target);
                    var stat = fs.statSync(dirname);
                    var isDirectory = stat.isDirectory();
                    var files = [];

                    if (isDirectory) {
                        files = fs.readdirSync(dirname).map(function (basename) {
                            var filename = path.join(dirname, basename);

                            return FileList.getFileInfo(filename);
                        });
                    }

                    return {
                        name: basename,
                        fullname: dirname,
                        mtime: stat.mtime.getTime(),
                        isDirectory: isDirectory,
                        files: files,
                        suffix: target.split('.').slice(1).join('.')
                    };
                }
            };

            function _getFilename(target) {
                var parts = target.split(path.sep).length;

                return parts > 1 ? path.resolve(target) : bundle.resolvePath(target);
            }
        });

        afterEach(function () {
            mockFs.restore();
        });

        describe('target', function () {
            it('should save target info', function () {
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .builder(function () {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        var cache = bundle.getNodeCache(target);
                        var expected = helper.fileInfo(target);
                        var actual = cache.get('target');

                        actual.should.be.deep.equal(expected);
                    });
            });

            it('should not rebuild if target has not been changed', function () {
                var actual = 0;
                var i = 0;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .saver(function (filename, result) {
                        actual = result;
                    })
                    .builder(function () {
                        return ++i;
                    })
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        return bundle.runTech(Tech);
                    })
                    .then(function () {
                        actual.should.be.equal('1');
                    });
            });

            it('should rebuild if target has been changed', function () {
                var actual = 0;
                var i = 0;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .saver(function (filename, result) {
                        actual = result;
                    })
                    .builder(function () {
                        return ++i;
                    })
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        helper.change(target);

                        return bundle.runTech(Tech);
                    })
                    .then(function () {
                        actual.should.be.equal('2');
                    });
            });
        });

        describe('dependencies', function () {
            it('should save dependency info', function () {
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependency', '.dependants')
                    .builder(function () {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        var cache = bundle.getNodeCache(target);
                        var expected = helper.fileInfo('.dependants');
                        var actual = cache.get('target:.dependants');

                        actual.should.be.deep.equal(expected);
                    });
            });

            describe('usages', function () {
                it('should not rebuild if dependence has not been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence', '.dependants')
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(function () {
                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('1');
                        });
                });

                it('should not rebuild if dependencies are not changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence-1', '.dependants-1')
                        .dependOn('dependence-2', '.dependants-2')
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(function () {
                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if dependence has been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence', '.dependants')
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(function () {
                            helper.change('.dependants');

                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('2');
                        });
                });

                it('should rebuild if one of the dependencies has been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence-1', '.dependants-1')
                        .dependOn('dependence-2', '.dependants-2')
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(function () {
                            helper.change('.dependants-1');

                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('2');
                        });
                });
            });

            describe('source list', function () {
                it('should not rebuild if dependencies are not changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useSourceListFilenames('dependencies', ['.dependants-1', '.dependants-2'])
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(function () {
                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if one of the dependencies has been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useSourceListFilenames('dependencies', ['.dependants-1', '.dependants-2'])
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(function () {
                            helper.change('.dependants-1');

                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('2');
                        });
                });
            });
        });

        describe('FileList', function () {
            describe('files', function () {
                it('should save FileList info', function () {
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useFileList(['ext'])
                        .builder(function () {})
                        .createTech();

                    fileList.addFiles(loadDirSync(blocksDirname));
                    bundle.provideTechData('?.files', fileList);

                    return bundle.runTech(Tech)
                        .then(function () {
                            var cache = bundle.getNodeCache(target);
                            var expected = helper.fileInfo(blockFilename);
                            var actual = cache.get('target:bundle.files');

                            actual.should.be.deep.equal([expected]);
                        });
                });

                it('should not rebuild if files has not been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useFileList(['ext'])
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    fileList.addFiles(loadDirSync(blocksDirname));
                    bundle.provideTechData('?.files', fileList);

                    return bundle.runTech(Tech)
                        .then(function () {
                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if files has been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useFileList(['ext'])
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    fileList.addFiles(loadDirSync(blocksDirname));
                    bundle.provideTechData('?.files', fileList);

                    return bundle.runTech(Tech)
                        .then(function () {
                            helper.change(blockFilename);

                            fileList = new FileList();
                            fileList.addFiles(loadDirSync(blocksDirname));
                            bundle.provideTechData('?.files', fileList);

                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('2');
                        });
                });
            });

            describe('dirs', function () {
                it('should save FileList info', function () {
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useDirList(['dir'])
                        .builder(function () {})
                        .createTech();

                    var dirInfo = helper.dirInfo(blockDirname);
                    fileList.addFiles([dirInfo]);
                    bundle.provideTechData('?.dirs', fileList);

                    return bundle.runTech(Tech)
                        .then(function () {
                            var cache = bundle.getNodeCache(target);
                            var info = cache.get('target:bundle.dirs');

                            info.should.be.deep.equal(dirInfo.files);
                        });
                });

                it('should not rebuild if files has not been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useDirList(['dir'])
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    fileList.addFiles([helper.dirInfo(blockDirname)]);
                    bundle.provideTechData('?.dirs', fileList);

                    return bundle.runTech(Tech)
                        .then(function () {
                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if files has been changed', function () {
                    var actual = 0;
                    var i = 0;
                    var Tech = flow
                        .name('name')
                        .target('target', target)
                        .useDirList(['dir'])
                        .saver(function (filename, result) {
                            actual = result;
                        })
                        .builder(function () {
                            return ++i;
                        })
                        .createTech();

                    fileList.addFiles([helper.dirInfo(blockDirname)]);
                    bundle.provideTechData('?.dirs', fileList);

                    return bundle.runTech(Tech)
                        .then(function () {
                            var filename = path.join(blockDirname, 'block.ext');

                            helper.change(filename);

                            fileList = new FileList();
                            fileList.addFiles([helper.dirInfo(blockDirname)]);
                            bundle.provideTechData('?.dirs', fileList);

                            return bundle.runTech(Tech);
                        })
                        .then(function () {
                            actual.should.be.equal('2');
                        });
                });
            });
        });

        describe('needRebuild', function () {
            it('should provide instance of Cache to method', function () {
                var actual;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .needRebuild(function (cache) {
                        actual = cache;
                    })
                    .builder(function () {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        var expected = bundle.getNodeCache(target);

                        actual.should.be.deep.equal(expected);
                    });
            });

            it('should rebuild if method return `false` but target has been changed', function () {
                var actual = 0;
                var i = 0;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .needRebuild(function () {
                        return false;
                    })
                    .saver(function (filename, result) {
                        actual = result;
                    })
                    .builder(function () {
                        return ++i;
                    })
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        helper.change(target);

                        return bundle.runTech(Tech);
                    })
                    .then(function () {
                        actual.should.be.equal('2');
                    });
            });

            it('should rebuild if method return `false` but dependence has been changed', function () {
                var actual = 0;
                var i = 0;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .needRebuild(function () {
                        return false;
                    })
                    .saver(function (filename, result) {
                        actual = result;
                    })
                    .builder(function () {
                        return ++i;
                    })
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        helper.change('.dependants');

                        return bundle.runTech(Tech);
                    })
                    .then(function () {
                        actual.should.be.equal('2');
                    });
            });

            it('should rebuild if method return `true` but target has not been changes', function () {
                var actual = 0;
                var i = 0;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .needRebuild(function () {
                        return true;
                    })
                    .saver(function (filename, result) {
                        actual = result;
                    })
                    .builder(function () {
                        return ++i;
                    })
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        return bundle.runTech(Tech);
                    })
                    .then(function () {
                        actual.should.be.equal('2');
                    });
            });

            it('should rebuild if method return `true` but dependence has not been changes', function () {
                var actual = 0;
                var i = 0;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .needRebuild(function () {
                        return true;
                    })
                    .saver(function (filename, result) {
                        actual = result;
                    })
                    .builder(function () {
                        return ++i;
                    })
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        return bundle.runTech(Tech);
                    })
                    .then(function () {
                        actual.should.be.equal('2');
                    });
            });
        });

        describe('saveCache', function () {
            it('should provide instance of Cache to method', function () {
                var actual;
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .saveCache(function (cache) {
                        actual = cache;
                    })
                    .builder(function () {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        var expected = bundle.getNodeCache(target);

                        actual.should.be.deep.equal(expected);
                    });
            });

            it('should cache custom data', function () {
                var expected = { data: true };
                var Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .saveCache(function (cache) {
                        cache.set('data', expected);
                    })
                    .builder(function () {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(function () {
                        var cache = bundle.getNodeCache(target);

                        cache.get('data').should.be.deep.equal(expected);
                    });
            });
        });
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
