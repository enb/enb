var callCount = 0;

exports.callCounter = function () {
    return ++callCount;
};

exports.getCallCount = function () {
    return callCount;
};
