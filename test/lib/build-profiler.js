'use strict'

const BuildProfiler = require('../../lib/build-profiler');

describe('BuildProfiler', function () {
    let buildGraph;
    let buildTimes;
    let profiler;

    describe('setStartTime', function () {
        beforeEach(function () {
            buildTimes = {};
            profiler = new BuildProfiler(buildTimes);
        });

        it('should set target with specified start time', function () {
            const expected = { 'bundle/target': { startTime: 100500, techName: 'tech' } };

            profiler.setStartTime('bundle/target', 'tech', 100500);

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should reset target with specified start time', function () {
            const expected = { 'bundle/target': { startTime: 100501, techName: 'tech' } };

            profiler.setStartTime('bundle/target', 'tech', 100500);
            profiler.setStartTime('bundle/target', 'tech', 100501);

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should set current time (Date.now())', function () {
            const expected = { 'bundle/target': { startTime: 0, techName: undefined } };

            profiler.setStartTime('bundle/target');

            expect(buildTimes).not.to.be.deep.equal(expected);
        });
    });

    describe('setEndTime', function () {
        beforeEach(function () {
            buildTimes = {};
            profiler = new BuildProfiler(buildTimes);
        });

        it('shouldn\'t set end time if there is no start time', function () {
            const expected = {};

            profiler.setEndTime('some-bundle', 'some-target');

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should set specified end time', function () {
            const expected = { 'bundle/target': { startTime: 100500, endTime: 100501, techName: 'tech' } };

            profiler.setStartTime('bundle/target', 'tech', 100500); // need to initialize benchmark object
            profiler.setEndTime('bundle/target', 100501);

            expect(buildTimes).to.be.deep.equal(expected);
        });
    });

    describe('calculateBuildTimes', function () {
        let graph = {
            'bundle/dep': {
                deps: []
            },
            'bundle/target': {
                deps: [
                    'bundle/dep'
                ]
            }
        };

        beforeEach(function () {
            buildGraph = function (graph) {
                return {
                    graph,
                    getDirectDeps(targetName) {
                        return this.graph[targetName] ? this.graph[targetName].deps : [];
                    }
                };
            };
        });

        it('should calculate time for each target if parallel run targets', function () {
            buildTimes = {
                'bundle/dep': {
                    startTime: 100500,
                    endTime: 100501
                },
                'bundle/target': {
                    startTime: 100500,
                    endTime: 100503
                }
            };
            profiler = new BuildProfiler(buildTimes);
            const expected = {
                'bundle/dep': {
                    startTime: 100500,
                    endTime: 100501,
                    selfTime: 1,
                    totalTime: 1,
                    watingTime: 0,
                    timeline: [{
                        startTime: 100500,
                        endTime: 100501
                    }]
                },
                'bundle/target': {
                    startTime: 100500,
                    endTime: 100503,
                    selfTime: 2,
                    totalTime: 3,
                    watingTime: 1,
                    timeline: [{
                        startTime: 100501,
                        endTime: 100503
                    }]
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should calculate time for each target if parent target run deps after some time  ', function () {
            buildTimes = {
                'bundle/dep': {
                    startTime: 100503,
                    endTime: 100504
                },
                'bundle/target': {
                    startTime: 100500,
                    endTime: 100506
                }
            };
            profiler = new BuildProfiler(buildTimes);

            const expected = {
                'bundle/dep': {
                    startTime: 100503,
                    endTime: 100504,
                    selfTime: 1,
                    totalTime: 1,
                    watingTime: 0,
                    timeline: [{
                        startTime: 100503,
                        endTime: 100504
                    }]
                },
                'bundle/target': {
                    startTime: 100500,
                    endTime: 100506,
                    selfTime: 5,
                    totalTime: 6,
                    watingTime: 1,
                    timeline: [
                        {
                            startTime: 100500,
                            endTime: 100503
                        },
                        {
                            startTime: 100504,
                            endTime: 100506
                        }
                    ]
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));
            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should calculate time for each target if deps run before target', function () {
            buildTimes = {
                'bundle/dep': {
                    startTime: 100500,
                    endTime: 100504
                },
                'bundle/target': {
                    startTime: 100501,
                    endTime: 100510
                }
            };
            profiler = new BuildProfiler(buildTimes);

            const expected = {
                'bundle/dep': {
                    startTime: 100500,
                    endTime: 100504,
                    selfTime: 4,
                    totalTime: 4,
                    watingTime: 0,
                    timeline: [{
                        startTime: 100500,
                        endTime: 100504
                    }]
                },
                'bundle/target': {
                    startTime: 100501,
                    endTime: 100510,
                    selfTime: 6,
                    totalTime: 9,
                    watingTime: 3,
                    timeline: [{
                        startTime: 100504,
                        endTime: 100510
                    }]
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should calculate time for each target if deps end before target run', function () {
            buildTimes = {
                'bundle/dep': {
                    startTime: 100500,
                    endTime: 100505
                },
                'bundle/target': {
                    startTime: 100506,
                    endTime: 100510
                }
            };
            profiler = new BuildProfiler(buildTimes);

            const expected = {
                'bundle/dep': {
                    startTime: 100500,
                    endTime: 100505,
                    selfTime: 5,
                    totalTime: 5,
                    watingTime: 0,
                    timeline: [{
                        startTime: 100500,
                        endTime: 100505
                    }]
                },
                'bundle/target': {
                    startTime: 100506,
                    endTime: 100510,
                    selfTime:4,
                    totalTime: 4,
                    watingTime: 0,
                    timeline: [{
                        startTime: 100506,
                        endTime: 100510
                    }]
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

            const expected = {
                'some-bundle/parallel-target-1': {
                    startTime: 100500,
                    endTime: 100504,
                    selfTime: 4,
                    totalTime: 4,
                    watingTime: 0,
                    timeline: [{
                        startTime: 100500,
                        endTime: 100504
                    }]
                },
                'some-bundle/parallel-target-2': {
                    startTime: 100501,
                    endTime: 100503,
                    selfTime: 2,
                    totalTime: 2,
                    watingTime: 0,
                    timeline: [{
                        startTime: 100501,
                        endTime: 100503
                    }]
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));

            expect(buildTimes).to.be.deep.equal(expected);
        });

        it('should calculate time target which waiting targets with breaks', function () {
            graph = {
                'bundle/target': { deps: ['bundle/dep-1', 'bundle/dep-2', 'bundle/dep-3'] },
                'bundle/dep-1': { deps: [] },
                'bundle/dep-2': { deps: [] },
                'bundle/dep-3': { deps: [] }
            };
            buildTimes = {
                'bundle/target': {
                    startTime: 0,
                    endTime: 100
                },
                'bundle/dep-1': {
                    startTime: 10,
                    endTime: 20
                },
                'bundle/dep-2': {
                    startTime: 30,
                    endTime: 40
                },
                'bundle/dep-3': {
                    startTime: 50,
                    endTime: 60
                }
            };
            profiler = new BuildProfiler(buildTimes);

            const expected = {
                'bundle/target': {
                    startTime: 0,
                    endTime: 100,
                    totalTime: 100,
                    selfTime: 70,
                    watingTime: 30,
                    timeline: [
                        {
                            startTime: 0,
                            endTime: 10
                        },
                        {
                            startTime: 20,
                            endTime: 30
                        },
                        {
                            startTime: 40,
                            endTime: 50
                        },
                        {
                            startTime: 60,
                            endTime: 100
                        }
                    ]
                },
                'bundle/dep-1': {
                    startTime: 10,
                    endTime: 20,
                    selfTime: 10,
                    totalTime: 10,
                    watingTime: 0,
                    timeline: [{
                        startTime: 10,
                        endTime: 20
                    }]
                },
                'bundle/dep-2': {
                    startTime: 30,
                    endTime: 40,
                    selfTime: 10,
                    totalTime: 10,
                    watingTime: 0,
                    timeline: [{
                        startTime: 30,
                        endTime: 40
                    }]
                },
                'bundle/dep-3': {
                    startTime: 50,
                    endTime: 60,
                    selfTime: 10,
                    totalTime: 10,
                    watingTime: 0,
                    timeline: [{
                        startTime: 50,
                        endTime: 60
                    }]
                }
            };

            profiler.calculateBuildTimes(buildGraph(graph));

            expect(buildTimes).to.be.deep.equal(expected);
        });
    });

    describe('calculateTechMetrics', function () {
        beforeEach(function () {
            profiler = new BuildProfiler({});
        });

        it('should return empty metrics', function () {
            const buildTimes = [];

            const metrics = profiler.calculateTechMetrics(buildTimes);

            expect(metrics).to.be.deep.equal([]);
        });

        it('should calculate metrics for target', function () {
            const buildTimes = [{
                target: 'target.css',
                techName: 'css',
                startTime: 10,
                endTime: 20,
                selfTime: 10,
                totalTime: 10,
                watingTime: 0,
                timeline: [{
                    startTime: 10,
                    endTime: 20
                }]
            }];

            const metrics = profiler.calculateTechMetrics(buildTimes);

            expect(metrics).to.be.deep.equal([
                {
                    tech: 'css',
                    callNumber: 1,
                    buildTime: 10,
                    buildTimePercent: 100,
                    buildTimes: [10]
                }
            ]);
        });

        it('should aggregate times by tech', function () {
            const buildTimes = [
                {
                    target: 'bundle-1/target.css',
                    techName: 'css',
                    startTime: 0,
                    endTime: 10,
                    selfTime: 10,
                    totalTime: 10,
                    watingTime: 0,
                    timeline: [{
                        startTime: 0,
                        endTime: 10
                    }]
                },
                {
                    target: 'bundle-2/target.css',
                    techName: 'css',
                    startTime: 10,
                    endTime: 20,
                    selfTime: 10,
                    totalTime: 10,
                    watingTime: 0,
                    timeline: [{
                        startTime: 10,
                        endTime: 20
                    }]
                }
            ];

            const metrics = profiler.calculateTechMetrics(buildTimes);

            expect(metrics).to.be.deep.equal([
                {
                    tech: 'css',
                    callNumber: 2,
                    buildTime: 20,
                    buildTimePercent: 100,
                    buildTimes: [10, 10]
                }
            ]);
        });

        it('should calculate real tech time', function () {
            const targetTimes = {
                techName: 'css',
                startTime: 0,
                endTime: 10,
                selfTime: 10,
                totalTime: 10,
                watingTime: 0,
                timeline: [{
                    startTime: 0,
                    endTime: 10
                }]
            };
            const buildTimes = [
                Object.assign({}, targetTimes, { target: 'bundle-1/target.css' }),
                Object.assign({}, targetTimes, { target: 'bundle-2/target.css' })
            ];

            const metrics = profiler.calculateTechMetrics(buildTimes);

            expect(metrics).to.be.deep.equal([
                {
                    tech: 'css',
                    callNumber: 2,
                    buildTime: 10,
                    buildTimePercent: 100,
                    buildTimes: [10, 10]
                }
            ]);
        });

        it('should ignore wait time', function () {
            const buildTimes = [
                {
                    target: 'bundle-1/target.css',
                    techName: 'css',
                    startTime: 0,
                    endTime: 100,
                    selfTime: 50,
                    totalTime: 100,
                    watingTime: 50,
                    timeline: [{
                        startTime: 50,
                        endTime: 100
                    }]
                },
                {
                    target: 'bundle-2/target.css',
                    techName: 'css',
                    startTime: 150,
                    endTime: 200,
                    selfTime: 30,
                    totalTime: 50,
                    watingTime: 20,
                    timeline: [{
                        startTime: 170,
                        endTime: 200
                    }]
                }
            ];

            const metrics = profiler.calculateTechMetrics(buildTimes);

            expect(metrics).to.be.deep.equal([
                {
                    tech: 'css',
                    callNumber: 2,
                    buildTime: 80,
                    buildTimePercent: 100,
                    buildTimes: [50, 30]
                }
            ]);
        });

        it('should calculate metrics for different techs', function () {
            const buildTimes = [
                {
                    target: 'bundle-1/target.js',
                    techName: 'js',
                    startTime: 0,
                    endTime: 100,
                    selfTime: 50,
                    totalTime: 100,
                    watingTime: 50,
                    timeline: [{
                        startTime: 50,
                        endTime: 100
                    }]
                },
                {
                    target: 'bundle-2/target.css',
                    techName: 'css',
                    startTime: 150,
                    endTime: 200,
                    selfTime: 30,
                    totalTime: 50,
                    watingTime: 20,
                    timeline: [{
                        startTime: 170,
                        endTime: 200
                    }]
                }
            ];

            const metrics = profiler.calculateTechMetrics(buildTimes);

            expect(metrics).to.be.deep.equal([
                {
                    tech: 'js',
                    callNumber: 1,
                    buildTime: 50,
                    buildTimePercent: 62.5,
                    buildTimes: [50]
                },
                {
                    tech: 'css',
                    callNumber: 1,
                    buildTime: 30,
                    buildTimePercent: 37.5,
                    buildTimes: [30]
                }
            ]);
        });
    });
});
