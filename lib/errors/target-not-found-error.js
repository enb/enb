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
    return error;
}

TargetNotFoundError.prototype = Error.prototype;

module.exports = TargetNotFoundError;
