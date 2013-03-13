function TargetNotFoundError() {
    var error = Error.apply(this, arguments);
    error.constructor = TargetNotFoundError;
    return error;
}

TargetNotFoundError.prototype = Error.prototype;

module.exports = TargetNotFoundError;