/**
 * TargetNotFoundError
 * ===================
 *
 * TargetNotFoundError — класс ошибки, которую возвращает ENB-платформа в случае, когда таргет не найден.
 * Используется ENB-middleware для того, чтобы передать запрос следующим express-обработчикам.
 *
 * @constructor
 */
function TargetNotFoundError() {
    var error = Error.apply(this, arguments);
    error.constructor = TargetNotFoundError;
    /*jshint proto:true */
    error.__proto__ = TargetNotFoundError.prototype;
    return error;
}

module.exports = TargetNotFoundError;

/*jshint proto:true */
TargetNotFoundError.prototype.__proto__ = Error.prototype;
