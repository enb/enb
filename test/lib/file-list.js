'use strict'

const path = require('path');
const mockFs = require('mock-fs');
const FileList = require('../../lib/file-list');

require('chai')
    .use(require('chai-as-promised'))
    .should();

describe('lib', function () {
    describe('file-list', function () {
        let fileList;
        let files1;
        let files2;

        beforeEach(function () {
            files1 = [
                { fullname: '/foo/bar/file1.txt', name: 'file1', suffix: 'txt', mtime: 1437573848385 },
                { fullname: '/foo/bar/file2.json', name: 'file2', suffix: 'json', mtime: 1437573848385 }
            ];
            files2 = [
                { fullname: '/foo/bar/file3.txt', name: 'file3', suffix: 'txt', mtime: 1437573848385 },
                { fullname: '/foo/bar/file4.html', name: 'file4', suffix: 'html', mtime: 1437573848385 }
            ];
        });

        describe('constructor', function () {
            beforeEach(function () {
                fileList = new FileList();
            });

            it('should be successfully initialized with empty items array', function () {
                fileList.items.should.be.instanceOf(Array).and.be.empty;
            });

            it('should be successfully initialized with empty slices array', function () {
                fileList.slices.should.be.instanceOf(Array).and.be.empty;
            });

            it('should be successfully initialized with empty bySuffix object', function () {
                fileList.bySuffix.should.be.instanceOf(Object);
                Object.keys(fileList.bySuffix).should.be.empty;
            });
        });

        describe('addFiles', function () {
            beforeEach(function () {
                fileList = new FileList();
                fileList.addFiles(files1);
                fileList.addFiles(files2);
            });

            it('should add given files arrays to slices array', function () {
                fileList.slices.should.have.length(2);
                fileList.slices[0].should.be.deep.equal(files1);
            });

            it('should add each file from files to items array', function () {
                fileList.items.should.have.length(4);
                fileList.items.should.be.deep.equal(files1.concat(files2));
            });

            it('should separate files by suffix and fill bySuffix model', function () {
                fileList.bySuffix.txt.should.be.instanceOf(Array).and.have.length(2);
                fileList.bySuffix.txt[0].should.be.deep.equal(files1[0]);

                fileList.bySuffix.json.should.be.instanceOf(Array).and.have.length(1);
                fileList.bySuffix.json[0].should.be.deep.equal(files1[1]);
            });
        });

        describe('getBySuffix', function () {
            beforeEach(function () {
                fileList = new FileList();
                fileList.addFiles(files1);
            });

            describe('argument is array', function () {
                it('should return empty result if given suffixes are set as empty array', function () {
                    fileList.getBySuffix([]).should.be.instanceOf(Array).and.be.empty;
                });

                it('should return valid result by given suffix (argument is array with single item)', function () {
                    fileList.getBySuffix(['txt']).should.be.instanceOf(Array).and.have.length(1);
                    fileList.getBySuffix(['txt'])[0].should.be.deep.equal(files1[0]);
                });

                it('should return valid result by given suffixes', function () {
                    fileList.addFiles(files2);

                    fileList.getBySuffix(['txt', 'json']).should.be.instanceOf(Array).and.have.length(3);
                    fileList.getBySuffix(['txt', 'json']).should.be.deep.equal(files1.concat(files2[0]));
                });

                it('should return valid result for complex suffix', function () {
                    const advancedFiles = [
                        {
                            fullname: '/foo1/bar1/file1.bemhtml.js',
                            name: 'file1',
                            suffix: 'bemhtml.js',
                            mtime: 1437573848385
                        }
                    ];

                    fileList.addFiles(advancedFiles);
                    fileList.getBySuffix(['bemhtml.js']).should.be.instanceOf(Array).and.have.length(1);
                    fileList.getBySuffix(['bemhtml.js'])[0].should.be.deep.equal(advancedFiles[0]);
                });
            });

            describe('suffix argument is string', function () {
                it('should return valid result by given suffix', function () {
                    fileList.getBySuffix('txt').should.be.instanceOf(Array).and.have.length(1);
                    fileList.getBySuffix('txt')[0].should.be.deep.equal(files1[0]);
                });

                it('should return empty result if files were not found by given suffix', function () {
                    fileList.getBySuffix('html').should.be.instanceOf(Array).and.be.empty;
                });
            });
        });

        describe('getByName', function () {
            beforeEach(function () {
                fileList = new FileList();
                fileList.addFiles(files1);
            });

            it('should return valid file info objects array by given file name', function () {
                fileList.getByName('file1').should.be.instanceOf(Array).and.have.length(1);
                fileList.getByName('file1')[0].should.be.deep.equal(files1[0]);
            });

            it('should return valid result for files with different fullnames but equal names', function () {
                const advancedFiles = [
                    { fullname: '/foo1/bar1/file1.txt', name: 'file1', suffix: 'txt', mtime: 1437573848385 }
                ];

                fileList.addFiles(advancedFiles);
                fileList.getByName('file1').should.be.instanceOf(Array).and.have.length(2);
                fileList.getByName('file1').should.be.deep.equal([].concat(files1[0]).concat(advancedFiles));
            });
        });

        describe('getFileInfo', function () {
            let dirName;
            let fullName;
            let mTime;

            beforeEach(function () {
                fileList = new FileList();
                dirName = path.resolve('./foo');
                fullName = path.resolve('./foo/file1.txt');
                mTime = new Date();
                mockFs({
                    foo: {
                        'file1.txt': mockFs.file({
                            content: 'Hello World',
                            ctime: mTime,
                            mtime: mTime
                        })
                    }
                });
            });

            afterEach(function () {
                mockFs.restore();
            });

            it('should return valid file info name', function () {
                fileList.getFileInfo(fullName).name.should.equal('file1.txt');
            });

            it('should return valid file info fullname', function () {
                fileList.getFileInfo(fullName).fullname.should.equal(fullName);
            });

            it('should return valid file info suffix', function () {
                fileList.getFileInfo(fullName).suffix.should.equal('txt');
            });

            it('should return valid file info mtime', function () {
                fileList.getFileInfo(fullName).mtime.should.equal(mTime.getTime());
            });

            it('should return "false" isDirectory flag for file', function () {
                fileList.getFileInfo(fullName).isDirectory.should.equal(false);
            });

            it('should return "true" isDirectory flag for directory', function () {
                fileList.getFileInfo(dirName).isDirectory.should.equal(true);
            });
        });
    });
});
