var BuildProfiler = require('../../lib/build-profiler');

describe('BuildProfiler', function () {
    var buildGraph;
    var buildTimes;
    var profiler;
    var graph = {
        'some-bundle/some-target': {
            deps: []
        },
        'another-bundle/another-target': {
            deps: [
                'some-bundle/some-target'
            ]
        }
    };

    describe('setStartTime', function () {
        beforeEach(function () {
            buildTimes = {};
            profiler = new BuildProfiler(buildTimes);
        });

        it('should set target with specified start time', function () {
            var expected = { 'some-bundle/some-target': { startTime: 100500 } };

            profiler.setStartTime('some-bundle/some-target', 100500);

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should reset target with specified start time', function () {
            var expected = { 'some-bundle/some-target': { startTime: 100501 } };

            profiler.setStartTime('some-bundle/some-target', 100500);
            profiler.setStartTime('some-bundle/some-target', 100501);

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should set current time (Date.now())', function () {
            var expected = { 'some-bundle/some-target': { startTime: 0 } };

            profiler.setStartTime('some-bundle/some-target');

            expect(buildTimes).not.to.be.deep.equal(expected);
        });
    });

    describe('setEndTime', function () {
        beforeEach(function () {
            buildTimes = {};
            profiler = new BuildProfiler(buildTimes);
        });

        it('shouldn\'t set end time if there is no start time', function () {
            var expected = {};

            profiler.setEndTime('some-bundle', 'some-target');

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should set specified end time', function () {
            var expected = { 'some-bundle/some-target': { startTime: 100500, endTime: 100501 } };

            profiler.setStartTime('some-bundle/some-target', 100500); // need to initialize benchmark object
            profiler.setEndTime('some-bundle/some-target', 100501);

            expect(buildTimes).to.be.deep.equal(expected);
        });
    });

    describe('calculateBuildTimes', function () {
        beforeEach(function () {
            buildGraph = function (graph) {
                return {
                    graph: graph,
                    getDirectDeps: function (targetName) {
                        return this.graph[targetName] ? this.graph[targetName].deps : [];
                    }
                };
            };
        });

        it('should calculate time for each target if parallel run targets', function () {
            buildTimes = {
                'some-bundle/some-target': {
                    startTime: 100500,
                    endTime: 100501
                },
                'another-bundle/another-target': {
                    startTime: 100500,
                    endTime: 100503
                }
            };
            profiler = new BuildProfiler(buildTimes);
            var expected = {
                'some-bundle/some-target': {
                    startTime: 100500,
                    endTime: 100501,
                    pureTime: 1,
                    totalTime: 1,
                    watingTime: 0
                },
                'another-bundle/another-target': {
                    startTime: 100500,
                    endTime: 100503,
                    pureTime: 2,
                    totalTime: 3,
                    watingTime: 1
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should calculate time for each target if parent target run deps after some time  ', function () {
            buildTimes = {
                'some-bundle/some-target': {
                    startTime: 100503,
                    endTime: 100504
                },
                'another-bundle/another-target': {
                    startTime: 100500,
                    endTime: 100506
                }
            };
            profiler = new BuildProfiler(buildTimes);

            var expected = {
                'some-bundle/some-target': {
                    startTime: 100503,
                    endTime: 100504,
                    pureTime: 1,
                    totalTime: 1,
                    watingTime: 0
                },
                'another-bundle/another-target': {
                    startTime: 100500,
                    endTime: 100506,
                    pureTime: 5,
                    totalTime: 6,
                    watingTime: 1
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));
            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should calculate time for each target if deps run before target', function () {
            buildTimes = {
                'some-bundle/some-target': {
                    startTime: 100500,
                    endTime: 100504
                },
                'another-bundle/another-target': {
                    startTime: 100501,
                    endTime: 100510
                }
            };
            profiler = new BuildProfiler(buildTimes);

            var expected = {
                'some-bundle/some-target': {
                    startTime: 100500,
                    endTime: 100504,
                    pureTime: 4,
                    totalTime: 4,
                    watingTime: 0
                },
                'another-bundle/another-target': {
                    startTime: 100501,
                    endTime: 100510,
                    pureTime: 6,
                    totalTime: 9,
                    watingTime: 3
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should calculate time for each target which are independent of each other', function () {
            graph = {
                'some-bundle/parallel-target-1': { deps: [] },
                'some-bundle/parallel-target-2': { deps: [] }
            };
            buildTimes = {
                'some-bundle/parallel-target-1': {
                    startTime: 100500,
                    endTime: 100504
                },
                'some-bundle/parallel-target-2': {
                    startTime: 100501,
                    endTime: 100503
                }
            };
            profiler = new BuildProfiler(buildTimes);

            var expected = {
                'some-bundle/parallel-target-1': {
                    startTime: 100500,
                    endTime: 100504,
                    pureTime: 4,
                    totalTime: 4,
                    watingTime: 0
                },
                'some-bundle/parallel-target-2': {
                    startTime: 100501,
                    endTime: 100503,
                    pureTime: 2,
                    totalTime: 2,
                    watingTime: 0
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));

            expect(buildTimes).to.be.deep.equal(expected);
        });
    });
});
