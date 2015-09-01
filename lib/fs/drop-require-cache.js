var deprecate = require('../utils/deprecate');
var projectConfigPath = require.resolve('../config/project-config');

// Исключение для модуля `project-config`.
// Выводим предупреждение, только если пользователь использует модуль.
if (module.parent.id !== projectConfigPath) {
    deprecate({module: 'drop-require-cache',
        rmSince: 'v1.0.0',
        replaceModule: 'clear-require'
    });
}

module.exports = function (requireFunc, filename) {
    var module = requireFunc.cache[filename];
    if (module) {
        if (module.parent) {
            if (module.parent.children) {
                var moduleIndex = module.parent.children.indexOf(module);
                if (moduleIndex !== -1) {
                    module.parent.children.splice(moduleIndex, 1);
                }
            }
            delete module.parent;
        }
        delete module.children;
        delete requireFunc.cache[filename];
    }
};
