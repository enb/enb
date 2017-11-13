# API

## Node API

Каждой технологии в `init` приходит инстанция (Это instance?) [ноды](terms.ru.md) (Node), для которой необходимо собирать [таргеты](terms.ru.md).
С помощью ноды технология взаимодействует с процессом сборки.

Основные методы класса Node:

### node.getTargetName

```javascript
// Возвращает имя таргета ноды без суффикса. Например, для ноды 'pages/index' результат — index.
String Node::getTargetName()
// Возвращает имя таргета ноды с суффиксом. Например, для ноды 'pages/index' с суффиксом 'js' результат — 'index.js'.
String Node::getTargetName(String suffix)
```

### node.unmaskTargetName

```javascript
// Демаскирует имя таргета ноды. Например, для ноды 'pages/index' и maskedTargetName='?.css', результат — 'index.css'.
String Node::unmaskTargetName(String maskedTargetName)
```

### node.resolvePath

```javascript
// Возвращает абсолютный путь к таргету.
String Node::resolvePath(String targetName)
```

**Пример**

```javascript
var fs = require('fs');
fs.writeFileSync(this.node.resolvePath(this.node.getTargetName('js')), 'alert("Hello World!");', 'utf8');
```

### node.resolveTarget

```javascript
// Оповещает ноду о том, что таргет собран. Опционально принимает результат сборки.
// Результатом может быть любой объект, который может быть полезен другим технологиям для продолжения сборки.
undefined Node::resolveTarget(String targetName[, Object result])
```

**Примеры**

```javascript
// #1
this.node.resolveTarget('index.css');

// #2 Получает имя таргета динамически с помощью суффикса.
this.node.resolveTarget(this.node.getTargetName('css'));

// #3 Получает имя таргета путем демаскирования таргета.
this.node.resolveTarget(this.node.unmaskTargetName('?.css'));

// #4 Передает значение.
var target = this.node.unmaskTargetName('?.deps.js'),
    targetPath = this.node.resolvePath(target);
delete require.cache[targetPath]; // Избавляемся от кэширования в nodejs.
this.node.resolveTarget(target, require(targetPath));
```

### node.rejectTarget

```javascript
// Оповещает ноду о том, что таргет не может быть собран из-за ошибки.
undefined Node::rejectTarget(String targetName, Error error)
```

**Примеры**

```javascript
// #1
this.node.rejectTarget('index.css', new Error('Could not find CSS Tools.'));

// #2 Получает имя таргета динамически с помощью суффикса.
this.node.rejectTarget(this.node.getTargetName('css'), new Error('Could not find CSS Tools.'));
```

### node.requireSources

```javascript
// Требует у ноды таргеты для дальнейшей сборки, возвращает промис.
// Промис выполняется, возвращая массив результатов, которыми резолвились требуемые таргеты.
// ВАЖНО: Не все технологии резолвят таргеты с результатом.
// В данный момент резолвят с результатом технологии: levels, deps*, files.
Promise(Object[]) Node::requireSources(String[] targetNames)
```

**Пример**

Необходимо объединить в один файл `index.css` и `index.ie.css` и записать в `index.all.css`.

```javascript
var vowFs = require('vow-fs');
// ...
  build: function() {
    var _this = this;
    return this.node.requireSources(['index.css', 'index.ie.css']).then(function() {
      return Vow.all([vowFs.read(_this.node.resolvePath('index.css'), 'utf8'), vowFs.read(_this.node.resolvePath('index.ie.css'), 'utf8')]).then(function(res) {
        return vowFs.write(_this.node.resolvePath('index.all.css'), res.join('\n'), 'utf8').then(function() {
          _this.node.resolveTarget('index.all.css');
        });
      });
    });
  }
// ...
```

### node.relativePath

```javascript
// Возвращает путь к таргету относительно ноды.
String Node::relativePath(String targetName)
```

### node.getDir

```javascript
// Возвращает полный путь к папке ноды.
String Node::getDir()
```

### node.getRootDir

```javascript
// Возвращает полный путь к корневой папке проекта.
String Node::getRootDir()
```

### node.getLogger

[Logger](/mdevils/enb/blob/master/lib/logger.js)

```javascript
// Возвращает инстанцию логгера для ноды.
Logger Node::getLogger()
```

**Пример**

```javascript
this.node.getLogger().log('Hello World');
```

### node.getNodeCache

[Cache](/mdevils/enb/blob/master/lib/cache/cache.js)

```javascript
// Возвращает инстанцию кэша для таргета ноды.
Cache Node::getNodeCache(String targetName)
```

Кэширование позволяет избегать повторной сборки файлов, для которых сборка не требуется. Кэшируется время изменения исходных и конечных файлов после окончания сборки каждой технологии. Логика кэширования реализуется в каждой технологии индивидуально для максимальной гибкости.

Валидация кэша производится с помощью методов `Boolean needRebuildFile(String cacheKey, String filePath)` и `Boolean needRebuildFileList(String cacheKey, FileInfo[] files)`.

Сохранение информации о файлах в кэш производится помощью методов `undefined cacheFileInfo(String cacheKey, String filePath)` и `undefined cacheFileList(String cacheKey, FileInfo[] files)`.

### node.getSharedResources

[SharedResources](lib/shared-resources/index.js)

Набор ресурсов, которые могут быть использованы в технологиях:
- [JobQueue](lib/shared-resources/job-queue/index.js) - пул дочерних процессов для выполнения «тяжелых» задач.

**Пример**

Контент файла `some-processor.js`:

```js
module.exports = function(arg1, arg2) {
    var res = null;
    // Здесь выполняется какая-то «нагруженная» работа, возможно с использованием промисов
    return res;
}
```
В технологии:

```js
var jobQueue = this.node.getSharedResources().jobQueue;
// Выполняет задачу в отдельном процессе, возвращает промис с результатом
return jobQueue.push(require.resolve('./path/to/processor'), arg1, arg2);
```
