require('chai').should();

var path = require('path');
var fs = require('fs');
var mockFs = require('mock-fs');
var framework = require('../../lib/build-flow');
var BaseTech = require('../../lib/tech/base-tech');
var NodeMock = require('../../lib/test/mocks/test-node');

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

            tech.getTargets().should.be.eql(['file.ext']);
        });

        it('should support target mask', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .createTech();

            var bundle = new NodeMock('bundle');
            var tech = init(bundle, Tech);

            tech.getTargets().should.be.eql(['bundle.ext']);
        });
    });

    describe('build', function () {
        var target = 'bundle.ext';
        var dir = 'bundle';
        var bundle;

        beforeEach(function () {
            bundle = new NodeMock(dir);

            mockFs({
                bundle: {}
            });
        });

        afterEach(function () {
            mockFs.restore();
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

        it('should have node in builder', function () {
            var Tech = flow
                .name('name')
                .target('target', '?.ext')
                .builder(function () {
                    this.node.should.be.equal(bundle);
                })
                .createTech();

            var tech = init(bundle, Tech);

            return tech.build();
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
});

function init(node, Tech, opts) {
    if (!(node instanceof NodeMock)) {
        opts = Tech;
        Tech = node;
        node = new NodeMock('node');
    }

    var tech = new Tech(opts);

    tech.init(node);

    return tech;
}
