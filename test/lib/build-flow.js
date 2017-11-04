'use strict'

const path = require('path');
const fs = require('fs');
const EOL = require('os').EOL;

const inherit = require('inherit');
const fileSuffix = require('file-suffix');
const mockFs = require('mock-fs');
const deasync = require('deasync');
const proxyquire = require('proxyquire').noCallThru();
const loadDirSync = require('mock-enb/utils/dir-utils').loadDirSync;
const MockNode = proxyquire('mock-enb/lib/mock-node', {
    enb: require('../../lib/api'),
    'enb/lib/cache/cache-storage': require('../../lib/cache/cache-storage'),
    'enb/lib/cache/cache': require('../../lib/cache/cache')
});

const framework = require('../../lib/build-flow');
const BaseTech = require('../../lib/tech/base-tech');
const FileList = require('../../lib/file-list');

describe('build-flow', () => {
    let flow;

    beforeEach(() => {
        flow = framework.create();
    });

    describe('errors', () => {
        it('should throw error if name is not specified', () => {
            ((() => {
                flow.createTech();
            })).should.throw('You should declare tech name using "name" method of BuildFlow.');
        });

        it('should throw error if target is not specified', () => {
            ((() => {
                flow
                    .name('name')
                    .createTech();
            })).should.throw('You should declare tech target name using "target" method of BuildFlow.');
        });
    });

    describe('dummy', () => {
        it('should create instance of BaseTech', () => {
            const Tech = flow
                .name('name')
                .target('target', 'file.ext')
                .createTech();

            const tech = new Tech();

            tech.should.instanceOf(BaseTech);
        });

        it('should create tech with specified name', () => {
            const Tech = flow
                .name('name')
                .target('target', 'file.ext')
                .createTech();

            const tech = new Tech();

            tech.getName().should.be.equal('name');
        });

        it('should throw error if target not specified', () => {
            const Tech = flow
                .name('name')
                .target('target')
                .createTech();

            const bundle = new MockNode('bundle');

            ((() => {
                init(bundle, Tech);
            })).should.throw('Option "target" is required for technology "name".');
        });

        it('should create tech with default target value', () => {
            const Tech = flow
                .name('name')
                .target('target', 'file.ext')
                .createTech();

            const tech = init(Tech);

            tech.getTargets().should.be.deep.equal(['file.ext']);
        });

        it('should create tech with specified target', () => {
            const Tech = flow
                .name('name')
                .target('target')
                .createTech();

            const tech = init(Tech, { target: 'file.ext' });

            tech.getTargets().should.be.deep.equal(['file.ext']);
        });

        it('should support target mask', () => {
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .createTech();

            const bundle = new MockNode('bundle');
            const tech = init(bundle, Tech);

            tech.getTargets().should.be.deep.equal(['bundle.ext']);
        });
    });

    describe('build', () => {
        const target = 'bundle.ext';
        const dir = 'bundle';
        let bundle;

        beforeEach(() => {
            bundle = new MockNode(dir);

            mockFs({
                bundle: {}
            });
        });

        afterEach(() => {
            mockFs.restore();
        });

        it('should throw error if builder method not defined', () => {
            const Tech = flow
                .name('name')
                .target('target', target)
                .createTech();

            return init(bundle, Tech)
                .build()
                .should.be.rejectedWith('You should declare build function using "build" method of BuildFlow.');
        });

        it('should write result to file', () => {
            const Tech = flow
                .name('name')
                .target('target', target)
                .builder(() => 'Hello World!')
                .createTech();

            const tech = init(bundle, Tech);

            return tech.build()
                .then(() => {
                    const filename = path.resolve(dir, target);
                    const contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal('Hello World!');
                });
        });

        it('should wrap result', () => {
            const Tech = flow
                .name('name')
                .target('target', target)
                .wrapper(str => `<div>${str}</div>`)
                .builder(() => 'Hello World!')
                .createTech();

            const tech = init(bundle, Tech);

            return tech.build()
                .then(() => {
                    const filename = path.resolve(dir, target);
                    const contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal('<div>Hello World!</div>');
                });
        });

        it('should redefine save method', () => {
            const filename = path.resolve('file.ext');
            const Tech = flow
                .name('name')
                .target('target', target)
                .saver((targetPath, str) => fs.writeFileSync(filename, str))
                .builder(() => 'Hello World!')
                .createTech();

            const tech = init(bundle, Tech);

            return tech.build()
                .then(() => {
                    const contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal('Hello World!');
                });
        });

        it('should prepare build', () => {
            const data = 'Hello world';
            const dataFilename = path.resolve('data.txt');
            const Tech = flow
                .name('name')
                .target('target', target)
                .prepare(function () {
                    this._someData = fs.readFileSync(dataFilename, 'utf-8');
                })
                .builder(function () {
                    return this._someData;
                })
                .createTech();

            const tech = init(bundle, Tech);

            fs.writeFileSync(dataFilename, data);

            return tech.build()
                .then(() => {
                    const filename = path.resolve(dir, target);
                    const contents = fs.readFileSync(filename, 'utf-8');

                    contents.should.be.equal(data);
                });
        });

        it('should have node in builder', () => {
            let actual = null;
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .builder(function () {
                    actual = this.node;
                })
                .createTech();

            const tech = init(bundle, Tech);

            return tech.build()
                .then(() => {
                    actual.should.be.equal(bundle);
                });
        });
    });

    describe('options', () => {
        describe('required', () => {
            it('should throw error if value is not specified', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineRequiredOption('opt')
                    .createTech();

                ((() => {
                    init(Tech);
                })).should.throw('Option "opt" is required for technology "name".');
            });

            it('should provide specified value', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineRequiredOption('opt')
                    .createTech();

                const tech = init(Tech, { opt: 'value' });

                tech._opt.should.be.equal('value');
            });

            it('should provide value to specified field', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineRequiredOption('opt', 'field')
                    .createTech();

                const tech = init(Tech, { opt: 'value' });

                tech.field.should.be.equal('value');
            });
        });

        describe('not required', () => {
            it('should provide default value', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                const tech = init(Tech);

                tech._opt.should.be.equal('value');
            });

            it('should provide specified value', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                const tech = init(Tech, { opt: 'value2' });

                tech._opt.should.be.equal('value2');
            });

            it('should provide value to specified field', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt', 'value', 'field')
                    .createTech();

                const tech = init(Tech);

                tech.field.should.be.equal('value');
            });
        });

        describe('aliases', () => {
            it('should provide value from option with alias name', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt')
                    .optionAlias('opt', 'alias')
                    .createTech();

                const tech = init(Tech, { alias: 'value' });

                tech._opt.should.be.equal('value');
            });

            it('should support several aliases', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .defineOption('opt1')
                    .defineOption('opt2')
                    .optionAlias('opt1', 'alias1')
                    .optionAlias('opt2', 'alias2')
                    .createTech();

                const tech = init(Tech, { alias1: 'value1', alias2: 'value2' });

                tech._opt1.should.be.equal('value1');
                tech._opt2.should.be.equal('value2');
            });
        });

        describe('target', () => {
            it('should support option mask for target', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '{opt}.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                const bundle = new MockNode('bundle');
                const tech = init(bundle, Tech);

                tech.getTargets().should.be.deep.equal(['value.ext']);
            });

            it('should remove `{opt}` if option is not specified', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '{opt}.ext')
                    .createTech();

                const bundle = new MockNode('bundle');
                const tech = init(bundle, Tech);

                tech.getTargets().should.be.deep.equal(['.ext']);
            });

            it('should remove `{opt}` if option has no default value', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '{opt}.ext')
                    .defineOption('opt')
                    .createTech();

                const bundle = new MockNode('bundle');
                const tech = init(bundle, Tech);

                tech.getTargets().should.be.deep.equal(['.ext']);
            });
        });
    });

    describe('FileList', () => {
        let file1;
        let file2;
        let files;

        before(() => {
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

        describe('files', () => {
            it('should expect FileList from `?.files` target', () => {
                const list = new FileList();
                const bundle = new MockNode('bundle');

                list.addFiles(files);
                bundle.provideTechData('?.files', list);

                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext1', 'ext2'])
                    .createTech();

                return build(bundle, Tech)
                    .should.become(files);
            });

            it('should add `filesTarget` option', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext'])
                    .createTech();

                const tech = init(Tech, { filesTarget: 'target.ext' });

                tech._filesTarget.should.be.equal('target.ext');
            });

            it('should filter files by suffixes', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext2'])
                    .createTech();

                return build(Tech)
                    .should.become([file2]);
            });

            it('should add `sourceSuffixes` option', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList(['ext2'])
                    .createTech();

                return build(Tech, { sourceSuffixes: ['ext1'] })
                    .should.become([file1]);
            });

            it('should support suffix as string', () => {
                const list = new FileList();
                const bundle = new MockNode('bundle');

                list.addFiles(files);
                bundle.provideTechData('?.files', list);

                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useFileList('ext1')
                    .createTech();

                return build(Tech)
                    .should.become([file1]);
            });
        });

        describe('dirs', () => {
            it('should expect FileList from `?.dirs` target', () => {
                const list = new FileList();
                const bundle = new MockNode('bundle');

                list.addFiles(files);

                bundle.provideTechData('?.dirs', list);

                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext1', 'ext2'])
                    .createTech();

                return build(bundle, Tech)
                    .should.become(files);
            });

            it('should add `dirsTarget` option', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext'])
                    .createTech();

                const tech = init(Tech, { dirsTarget: 'target' });

                tech._dirsTarget.should.be.equal('target');
            });

            it('should filter files by suffixes', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext2'])
                    .createTech();

                return build(Tech)
                    .should.become([file2]);
            });

            it('should add `sourceDirSuffixes` option', () => {
                const Tech = flow
                    .name('name')
                    .target('target', '?.ext')
                    .useDirList(['ext2'])
                    .createTech();

                return build(Tech, { sourceDirSuffixes: ['ext1'] })
                    .should.become([file1]);
            });

            it('should support suffix as string', () => {
                const Tech = flow
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
                const list = new FileList();

                opts = Tech;
                Tech = node;
                node = new MockNode('node');

                list.addFiles(files);

                node.provideTechData('?.files', list);
                node.provideTechData('?.dirs', list);
            }

            let actual;
            const SafeTech = Tech.buildFlow()
                .saver(() => {})
                .builder(sourceFiles => {
                    actual = sourceFiles;
                })
                .createTech();

            return node.runTech(SafeTech, opts)
                .then(() => actual);
        }
    });

    describe('dependencies', () => {
        let dir;
        let basename;

        before(() => {
            dir = 'bundle';
            basename = '.dependants';
        });

        beforeEach(() => {
            mockFs({
                bundle: {}
            });
        });

        afterEach(() => {
            mockFs.restore();
        });

        it('should require source from its node', () => {
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .dependOn('dependence', basename)
                .builder(() => {})
                .createTech();

            return build(Tech)
                .then(requires => {
                    requires.should.be.contain(basename);
                });
        });

        it('should require source from its node and provide filename', () => {
            let actual = '';

            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceFilename('dependence', basename)
                .builder(filename => {
                    actual = filename;
                })
                .createTech();

            return build(Tech)
                .then(requires => {
                    const expected = path.resolve(dir, basename);

                    requires.should.be.contain('.dependants');
                    actual.should.be.equal(expected);
                });
        });

        it('should require sources from its node and provide filenames', () => {
            let actual = [];

            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceListFilenames('dependencies', ['.dep1', '.dep2'])
                .builder(filenames => {
                    actual = filenames;
                })
                .createTech();

            return build(Tech)
                .then(requires => {
                    requires.should.be.contain('.dep1');
                    requires.should.be.contain('.dep2');

                    actual.should.be.deep.equal([
                        path.resolve(dir, '.dep1'),
                        path.resolve(dir, '.dep2')
                    ]);
                });
        });

        it('should require source from its node and provide contents', () => {
            let actual = '';
            const dirname = path.resolve(dir);
            const filename = path.join(dirname, basename);

            fs.writeFileSync(filename, 'Hello World!');

            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceText('dependencies', '.dependants')
                .builder(contents => {
                    actual = contents;
                })
                .createTech();

            return build(Tech)
                .then(requires => {
                    requires.should.be.contain('.dependants');

                    actual.should.be.equal('Hello World!');
                });
        });

        it('should require source from its node and provide data', () => {
            let actual = {};
            const expected = { data: true };

            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceResult('dependencies', basename)
                .builder(data => {
                    actual = data;
                })
                .createTech();

            return build(Tech, { '.dependants': expected })
                .then(() => {
                    actual.should.be.deep.equal(expected);
                });
        });

        function build(Tech, data) {
            let requires = [];
            const MyMockNode = inherit(MockNode, {
                requireSources(sources) {
                    requires = [].concat(requires, sources);

                    return this.__base(sources);
                }
            });
            const bundle = new MyMockNode(dir);

            if (data) {
                Object.keys(data).forEach(key => {
                    bundle.provideTechData(key, data[key]);
                });
            }

            return bundle.runTech(Tech)
                .then(() => requires);
        }
    });

    describe('deprecated', () => {
        beforeEach(() => {
            mockFs({
                bundle: {}
            });
        });

        afterEach(() => {
            mockFs.restore();
        });

        it('should warn about deprecated tech in current package', () => {
            const bundle = new MockNode('bundle');
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package')
                .builder(() => {})
                .createTech();

            return bundle.runTech(Tech)
                .then(() => {
                    const logger = bundle.getLogger();
                    const messages = logger._messages;

                    messages.should.be.deep.contains({
                        message: 'Tech old-package/techs/name is deprecated.',
                        scope: path.join('bundle', 'bundle.ext'),
                        action: '[deprecated]'
                    });
                });
        });

        it('should warn about deprecated tech and point to new package', () => {
            const bundle = new MockNode('bundle');
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package', 'new-package')
                .builder(() => {})
                .createTech();

            return bundle.runTech(Tech)
                .then(() => {
                    const logger = bundle.getLogger();
                    const messages = logger._messages;

                    messages.should.be.deep.contains({
                        message: 'Tech old-package/techs/name is deprecated. ' +
                            'Install package new-package and use tech new-package/techs/name instead.',
                        scope: path.join('bundle', 'bundle.ext'),
                        action: '[deprecated]'
                    });
                });
        });

        it('should warn about deprecated tech and point to new tech', () => {
            const bundle = new MockNode('bundle');
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package', 'new-package', 'new-tech')
                .builder(() => {})
                .createTech();

            return bundle.runTech(Tech)
                .then(() => {
                    const logger = bundle.getLogger();
                    const messages = logger._messages;

                    messages.should.be.deep.contains({
                        message: 'Tech old-package/techs/name is deprecated. ' +
                            'Install package new-package and use tech new-package/techs/new-tech instead.',
                        scope: path.join('bundle', 'bundle.ext'),
                        action: '[deprecated]'
                    });
                });
        });

        it('should warn about deprecated tech and write description', () => {
            const bundle = new MockNode('bundle');
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .deprecated('old-package', 'new-package', 'new-tech', ' The Description.')
                .builder(() => {})
                .createTech();

            return bundle.runTech(Tech)
                .then(() => {
                    const logger = bundle.getLogger();
                    const messages = logger._messages;

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

    describe('helpers', () => {
        const dir = 'files';
        const filename1 = path.join(dir, 'file-1.ext');
        const filename2 = path.join(dir, 'file-2.ext');
        const contents1 = 'one';
        const contents2 = 'two';

        beforeEach(() => {
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

        afterEach(() => {
            mockFs.restore();
        });

        it('should join empty string', () => {
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .justJoinFiles()
                .createTech();

            return build(Tech)
                .should.become('');
        });

        it('should ingore source result', () => {
            const bundle = new MockNode('bundle');
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceResult('dependence', '.dependants')
                .justJoinFiles()
                .createTech();

            bundle.provideTechData('.dependants', { data: true });

            return build(bundle, Tech)
                .should.become('');
        });

        it('should join files', () => {
            const Tech = flow
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

        it('should join files with comments', () => {
            const path1 = path.join('..', filename1);
            const path2 = path.join('..', filename2);
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useFileList(['ext'])
                .justJoinFilesWithComments()
                .createTech();

            return build(Tech)
                .should.become([
                    `/* begin: ${path1} */`,
                    contents1,
                    `/* end: ${path1} */`,
                    `/* begin: ${path2} */`,
                    contents2,
                    `/* end: ${path2} */`
                ].join(EOL));
        });

        it('should join files with specified wrapper', () => {
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useFileList(['ext'])
                .justJoinFiles((filename, contents) => [filename, contents].join(': '))
                .createTech();

            return build(Tech)
                .should.become([
                    `${filename1}: ${contents1}`,
                    `${filename2}: ${contents2}`
                ].join(EOL));
        });

        it('should join source files', () => {
            const Tech = flow
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

        it('should join source files with specified wrapper', () => {
            const Tech = flow
                .name('name')
                .target('target', '?.ext')
                .useSourceFilename('source-one', 'target-1.ext')
                .useSourceFilename('source-two', 'target-2.ext')
                .justJoinFiles((filename, contents) => [filename, contents].join(': '))
                .createTech();

            return build(Tech)
                .should.become([
                    `${path.resolve('bundle', 'target-1.ext')}: ${contents1}`,
                    `${path.resolve('bundle', 'target-2.ext')}: ${contents2}`
                ].join(EOL));
        });

        it('should join sources', () => {
            const Tech = flow
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

        it('should join files if use `justJoinSources`', () => {
            const Tech = flow
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

        it('should ignore source result if use `justJoinSources`', () => {
            const bundle = new MockNode('bundle');
            const Tech = flow
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

            const list = new FileList();

            list.addFiles(loadDirSync(dir));
            node.provideTechData('?.files', list);

            return node.runTechAndGetContent(Tech)
                .spread(res => res);
        }
    });

    describe('inheritance', () => {
        beforeEach(() => {
            mockFs({
                bundle: {}
            });
        });

        afterEach(() => {
            mockFs.restore();
        });

        describe('base', () => {
            it('should inherit tech', () => {
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .createTech();

                const tech1 = new Tech();
                const tech2 = new ChildTech();

                tech1.getName().should.be.equal(tech2.getName());
                tech1.getTargets().should.be.deep.equal(tech2.getTargets());
                tech1.build().should.be.deep.equal(tech2.build());
            });

            it('should inherit name', () => {
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .createTech();

                const tech = new ChildTech();

                tech.getName().should.be.equal('name');
            });

            it('should inherit target', () => {
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .createTech();

                const tech = init(ChildTech);

                tech.getTargets().should.be.deep.equal(['file.ext']);
            });

            it('should redefine name', () => {
                const Tech = flow
                    .name('old-name')
                    .target('target', 'file.ext')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .name('new-name')
                    .createTech();

                const tech = new ChildTech();

                tech.getName().should.be.equal('new-name');
            });

            it('should redefine target', () => {
                const Tech = flow
                    .name('name')
                    .target('target', 'old-file.ext')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .target('target', 'new-file.ext')
                    .createTech();

                const tech = init(ChildTech);

                tech.getTargets().should.be.deep.equal(['new-file.ext']);
            });
        });

        describe('options', () => {
            it('should inherit option', () => {
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .defineOption('opt', 'value')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .createTech();

                const tech = init(ChildTech);

                tech._opt.should.be.equal('value');
            });

            it('should redefine option', () => {
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .defineOption('opt', 'old-value')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .defineOption('opt', 'new-value')
                    .createTech();

                const tech = init(ChildTech);

                tech._opt.should.be.equal('new-value');
            });
        });

        describe('methods', () => {
            it('should inherit method', () => {
                let actual = '';
                const expected = 'Hello World!';
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .methods({
                        hello() {
                            return expected;
                        }
                    })
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = this.hello();
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal(expected);
                    });
            });

            it('should inherit methods that use other method', () => {
                let actual = '';
                const expected = 'Hello World!';
                const Tech = flow
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

                const ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = this.hello();
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal(expected);
                    });
            });

            it('should redefine method', () => {
                let actual = '';
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .methods({
                        hello() {
                            return 'Hello World!';
                        }
                    })
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .builder(function () {
                        actual = this.hello();
                    })
                    .methods({
                        hello() {
                            return 'Hi World!';
                        }
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal('Hi World!');
                    });
            });

            it('should inherit static method', () => {
                let actual = '';
                const expected = 'Hello World!';
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .staticMethods({
                        hello() {
                            return expected;
                        }
                    })
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .builder(() => {
                        actual = ChildTech.hello();
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal(expected);
                    });
            });

            it('should redefine static method', () => {
                let actual = '';
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .staticMethods({
                        hello() {
                            return 'Hello World!';
                        }
                    })
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .builder(() => {
                        actual = ChildTech.hello();
                    })
                    .staticMethods({
                        hello() {
                            return 'Hi World!';
                        }
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal('Hi World!');
                    });
            });
        });

        describe('super', () => {
            let MyBaseTech;
            let Tech;
            let bundle;
            beforeEach(() => {
                bundle = new MockNode('bundle');
                MyBaseTech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .createTech();
            });

            describe('builder', () => {
                beforeEach(() => {
                    Tech = MyBaseTech.buildFlow()
                        .builder(() => '42')
                        .createTech();
                });

                it('should call base builder by default', () => {
                    const ChildTech = Tech.buildFlow().createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['42']);
                });

                it('should allow to call base builder via __base property', () => {
                    const ChildTech = Tech.buildFlow()
                        .builder(function () {
                            return `!${this.__base.apply(this, arguments)}`;
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['!42']);
                });

                it('should be passed thru the child to the base builder', () => {
                    const ChildTech = Tech.buildFlow().createTech();
                    const GrandChildTech = ChildTech.buildFlow()
                        .builder(function () {
                            return `!${this.__base.apply(this, arguments)}`;
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(GrandChildTech)
                        .should.eventually.eql(['!42']);
                });
            });

            describe('methods', () => {
                function _thisHello() {
                    return this.hello();
                }
                beforeEach(() => {
                    Tech = MyBaseTech.buildFlow()
                        .builder(() => 'Definitely not forty two.')
                        .methods({
                            hello() { return 42; }
                        })
                        .createTech();
                });

                it('should call base method by default', () => {
                    const ChildTech = Tech.buildFlow()
                        .builder(_thisHello)
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['42']);
                });

                it('should allow to call base method via __base property', () => {
                    const ChildTech = Tech.buildFlow()
                        .builder(_thisHello)
                        .methods({
                            hello() {
                                return `!${this.__base.apply(this, arguments)}`;
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['!42']);
                });

                it('should be passed thru the child to the base method', () => {
                    const ChildTech = Tech.buildFlow()
                        .builder(_thisHello)
                        .createTech();
                    const GrandChildTech = ChildTech.buildFlow()
                        .methods({
                            hello() {
                                return `!${this.__base.apply(this, arguments)}`;
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(GrandChildTech)
                        .should.eventually.eql(['!42']);
                });
            });

            describe('static methods', () => {
                function _staticHello() {
                    return this.__self.hello();
                }
                beforeEach(() => {
                    Tech = MyBaseTech.buildFlow()
                        .builder(() => 'Definitely not forty two.')
                        .staticMethods({
                            hello() { return 42; }
                        })
                        .createTech();
                });

                it('should call base static method by default', () => {
                    const ChildTech = Tech.buildFlow()
                        .builder(_staticHello)
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['42']);
                });

                it('should allow to call base static method via __base property', () => {
                    const ChildTech = Tech.buildFlow()
                        .builder(_staticHello)
                        .staticMethods({
                            hello() {
                                return `!${this.__base.apply(this, arguments)}`;
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(ChildTech)
                        .should.eventually.eql(['!42']);
                });

                it('should be passed thru the child to the base static method', () => {
                    const ChildTech = Tech.buildFlow()
                        .builder(_staticHello)
                        .createTech();
                    const GrandChildTech = ChildTech.buildFlow()
                        .staticMethods({
                            hello() {
                                return `!${this.__base.apply(this, arguments)}`;
                            }
                        })
                        .createTech();

                    return bundle.runTechAndGetContent(GrandChildTech)
                        .should.eventually.eql(['!42']);
                });
            });
        });

        describe('dependencies', () => {
            it('should inherit dependence', () => {
                const dir = 'bundle';
                const basename = '.dependants';
                let actual = '';
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useSourceFilename('dependence', basename)
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .builder(filename => {
                        actual = filename;
                    })
                    .createTech();

                const bundle = new MockNode(dir);

                return bundle.runTech(ChildTech)
                    .then(() => {
                        const expected = path.resolve(dir, basename);

                        actual.should.be.equal(expected);
                    });
            });

            it('should redefine dependence', () => {
                const dir = 'bundle';
                let actual = '';
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useSourceFilename('dependence', '.old-file.ext')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .useSourceFilename('dependence', 'new-file.ext')
                    .builder(filename => {
                        actual = filename;
                    })
                    .createTech();

                const bundle = new MockNode(dir);

                return bundle.runTech(ChildTech)
                    .then(() => {
                        const expected = path.resolve(dir, 'new-file.ext');

                        actual.should.be.equal(expected);
                    });
            });
        });

        describe('unuse', () => {
            it('should unuse other target', () => {
                let actual;
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useSourceFilename('dependence', '.old-file.ext')
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .unuseTarget('dependence')
                    .builder(function () {
                        actual = arguments.length;
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal(0);
                    });
            });

            it('should unuse other target with files', () => {
                let actual;
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useFileList(['ext'])
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .unuseFileList()
                    .builder(function () {
                        actual = arguments.length;
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal(0);
                    });
            });

            it('should unuse other target with dirs', () => {
                let actual;
                const Tech = flow
                    .name('name')
                    .target('target', 'file.ext')
                    .useDirList(['ext'])
                    .createTech();

                const ChildTech = Tech.buildFlow()
                    .unuseDirList()
                    .builder(function () {
                        actual = arguments.length;
                    })
                    .createTech();

                const bundle = new MockNode('bundle');

                return bundle.runTech(ChildTech)
                    .then(() => {
                        actual.should.be.equal(0);
                    });
            });
        });
    });

    describe('cache', () => {
        let bundle;
        let helper;
        let target;
        let blocksDirname;
        let blockFilename;
        let blockDirname;
        let fileList;

        before(() => {
            target = 'file.ext';
            blocksDirname = path.resolve('blocks');
            blockFilename = path.join(blocksDirname, 'block.ext');
            blockDirname = path.join(blocksDirname, 'block.dir');
        });

        beforeEach(() => {
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
                    const filename = _getFilename(target);

                    deasync.sleep(10);

                    fs.writeFileSync(filename, 'new-value');
                },
                fileInfo(target) {
                    const filename = _getFilename(target);
                    const basename = path.basename(target);
                    const mtime = fs.statSync(filename).mtime.getTime();

                    return {
                        name: basename,
                        fullname: filename,
                        mtime,
                        suffix: fileSuffix(basename)
                    };
                },
                dirInfo(target) {
                    const dirname = _getFilename(target);
                    const basename = path.basename(target);
                    const stat = fs.statSync(dirname);
                    const isDirectory = stat.isDirectory();
                    let files = [];

                    if (isDirectory) {
                        files = fs.readdirSync(dirname).map(basename => {
                            const filename = path.join(dirname, basename);

                            return FileList.getFileInfo(filename);
                        });
                    }

                    return {
                        name: basename,
                        fullname: dirname,
                        mtime: stat.mtime.getTime(),
                        isDirectory,
                        files,
                        suffix: fileSuffix(basename)
                    };
                }
            };

            function _getFilename(target) {
                const parts = target.split(path.sep).length;

                return parts > 1 ? path.resolve(target) : bundle.resolvePath(target);
            }
        });

        afterEach(() => {
            mockFs.restore();
        });

        describe('target', () => {
            it('should save target info', () => {
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .builder(() => {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        const cache = bundle.getNodeCache(target);
                        const expected = helper.fileInfo(target);
                        const actual = cache.get('target');

                        actual.should.be.deep.equal(expected);
                    });
            });

            it('should not rebuild if target has not been changed', () => {
                let actual = 0;
                let i = 0;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .saver((filename, result) => {
                        actual = result;
                    })
                    .builder(() => ++i)
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => bundle.runTech(Tech))
                    .then(() => {
                        actual.should.be.equal('1');
                    });
            });

            it('should rebuild if target has been changed', () => {
                let actual = 0;
                let i = 0;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .saver((filename, result) => {
                        actual = result;
                    })
                    .builder(() => ++i)
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        helper.change(target);

                        return bundle.runTech(Tech);
                    })
                    .then(() => {
                        actual.should.be.equal('2');
                    });
            });
        });

        describe('dependencies', () => {
            it('should save dependency info', () => {
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependency', '.dependants')
                    .builder(() => {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        const cache = bundle.getNodeCache(target);
                        const expected = helper.fileInfo('.dependants');
                        const actual = cache.get('target:.dependants');

                        actual.should.be.deep.equal(expected);
                    });
            });

            describe('usages', () => {
                it('should not rebuild if dependence has not been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence', '.dependants')
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(() => bundle.runTech(Tech))
                        .then(() => {
                            actual.should.be.equal('1');
                        });
                });

                it('should not rebuild if dependencies are not changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence-1', '.dependants-1')
                        .dependOn('dependence-2', '.dependants-2')
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(() => bundle.runTech(Tech))
                        .then(() => {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if dependence has been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence', '.dependants')
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(() => {
                            helper.change('.dependants');

                            return bundle.runTech(Tech);
                        })
                        .then(() => {
                            actual.should.be.equal('2');
                        });
                });

                it('should rebuild if one of the dependencies has been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .dependOn('dependence-1', '.dependants-1')
                        .dependOn('dependence-2', '.dependants-2')
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(() => {
                            helper.change('.dependants-1');

                            return bundle.runTech(Tech);
                        })
                        .then(() => {
                            actual.should.be.equal('2');
                        });
                });
            });

            describe('source list', () => {
                it('should not rebuild if dependencies are not changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useSourceListFilenames('dependencies', ['.dependants-1', '.dependants-2'])
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(() => bundle.runTech(Tech))
                        .then(() => {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if one of the dependencies has been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useSourceListFilenames('dependencies', ['.dependants-1', '.dependants-2'])
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    return bundle.runTech(Tech)
                        .then(() => {
                            helper.change('.dependants-1');

                            return bundle.runTech(Tech);
                        })
                        .then(() => {
                            actual.should.be.equal('2');
                        });
                });
            });
        });

        describe('FileList', () => {
            describe('files', () => {
                it('should save FileList info', () => {
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useFileList(['ext'])
                        .builder(() => {})
                        .createTech();

                    fileList.addFiles(loadDirSync(blocksDirname));
                    bundle.provideTechData('?.files', fileList);

                    return bundle.runTech(Tech)
                        .then(() => {
                            const cache = bundle.getNodeCache(target);
                            const expected = helper.fileInfo(blockFilename);
                            const actual = cache.get('target:bundle.files');

                            actual.should.be.deep.equal([expected]);
                        });
                });

                it('should not rebuild if files has not been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useFileList(['ext'])
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    fileList.addFiles(loadDirSync(blocksDirname));
                    bundle.provideTechData('?.files', fileList);

                    return bundle.runTech(Tech)
                        .then(() => bundle.runTech(Tech))
                        .then(() => {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if files has been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useFileList(['ext'])
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    fileList.addFiles(loadDirSync(blocksDirname));
                    bundle.provideTechData('?.files', fileList);

                    return bundle.runTech(Tech)
                        .then(() => {
                            helper.change(blockFilename);

                            fileList = new FileList();
                            fileList.addFiles(loadDirSync(blocksDirname));
                            bundle.provideTechData('?.files', fileList);

                            return bundle.runTech(Tech);
                        })
                        .then(() => {
                            actual.should.be.equal('2');
                        });
                });
            });

            describe('dirs', () => {
                it('should save FileList info', () => {
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useDirList(['dir'])
                        .builder(() => {})
                        .createTech();

                    const dirInfo = helper.dirInfo(blockDirname);
                    fileList.addFiles([dirInfo]);
                    bundle.provideTechData('?.dirs', fileList);

                    return bundle.runTech(Tech)
                        .then(() => {
                            const cache = bundle.getNodeCache(target);
                            const info = cache.get('target:bundle.dirs');

                            info.should.be.deep.equal(dirInfo.files);
                        });
                });

                it('should not rebuild if files has not been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useDirList(['dir'])
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    fileList.addFiles([helper.dirInfo(blockDirname)]);
                    bundle.provideTechData('?.dirs', fileList);

                    return bundle.runTech(Tech)
                        .then(() => bundle.runTech(Tech))
                        .then(() => {
                            actual.should.be.equal('1');
                        });
                });

                it('should rebuild if files has been changed', () => {
                    let actual = 0;
                    let i = 0;
                    const Tech = flow
                        .name('name')
                        .target('target', target)
                        .useDirList(['dir'])
                        .saver((filename, result) => {
                            actual = result;
                        })
                        .builder(() => ++i)
                        .createTech();

                    fileList.addFiles([helper.dirInfo(blockDirname)]);
                    bundle.provideTechData('?.dirs', fileList);

                    return bundle.runTech(Tech)
                        .then(() => {
                            const filename = path.join(blockDirname, 'block.ext');

                            helper.change(filename);

                            fileList = new FileList();
                            fileList.addFiles([helper.dirInfo(blockDirname)]);
                            bundle.provideTechData('?.dirs', fileList);

                            return bundle.runTech(Tech);
                        })
                        .then(() => {
                            actual.should.be.equal('2');
                        });
                });
            });
        });

        describe('needRebuild', () => {
            it('should provide instance of Cache to method', () => {
                let actual;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .needRebuild(cache => {
                        actual = cache;
                    })
                    .builder(() => {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        const expected = bundle.getNodeCache(target);

                        actual.should.be.deep.equal(expected);
                    });
            });

            it('should rebuild if method return `false` but target has been changed', () => {
                let actual = 0;
                let i = 0;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .needRebuild(() => false)
                    .saver((filename, result) => {
                        actual = result;
                    })
                    .builder(() => ++i)
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        helper.change(target);

                        return bundle.runTech(Tech);
                    })
                    .then(() => {
                        actual.should.be.equal('2');
                    });
            });

            it('should rebuild if method return `false` but dependence has been changed', () => {
                let actual = 0;
                let i = 0;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .needRebuild(() => false)
                    .saver((filename, result) => {
                        actual = result;
                    })
                    .builder(() => ++i)
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        helper.change('.dependants');

                        return bundle.runTech(Tech);
                    })
                    .then(() => {
                        actual.should.be.equal('2');
                    });
            });

            it('should rebuild if method return `true` but target has not been changes', () => {
                let actual = 0;
                let i = 0;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .needRebuild(() => true)
                    .saver((filename, result) => {
                        actual = result;
                    })
                    .builder(() => ++i)
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => bundle.runTech(Tech))
                    .then(() => {
                        actual.should.be.equal('2');
                    });
            });

            it('should rebuild if method return `true` but dependence has not been changes', () => {
                let actual = 0;
                let i = 0;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .needRebuild(() => true)
                    .saver((filename, result) => {
                        actual = result;
                    })
                    .builder(() => ++i)
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => bundle.runTech(Tech))
                    .then(() => {
                        actual.should.be.equal('2');
                    });
            });
        });

        describe('saveCache', () => {
            it('should provide instance of Cache to method', () => {
                let actual;
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .saveCache(cache => {
                        actual = cache;
                    })
                    .builder(() => {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        const expected = bundle.getNodeCache(target);

                        actual.should.be.deep.equal(expected);
                    });
            });

            it('should cache custom data', () => {
                const expected = { data: true };
                const Tech = flow
                    .name('name')
                    .target('target', target)
                    .dependOn('dependence', '.dependants')
                    .saveCache(cache => {
                        cache.set('data', expected);
                    })
                    .builder(() => {})
                    .createTech();

                return bundle.runTech(Tech)
                    .then(() => {
                        const cache = bundle.getNodeCache(target);

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

    const tech = new Tech(opts);

    tech.init(node);

    return tech;
}
