# API

## Node API

Each technology in `init` receives an instance of the [node](../terms/terms.en.md) for building [targets](../terms/terms.en.md).
The technology uses the node to interact with the build process.

Main methods of the Node class:

### node.getTargetName

```javascript
// Returns the name of the node target without a suffix. For example, for the 'pages/index' node, the result is 'index'.
String Node::getTargetName()
// Returns the name of the node target with a suffix. For example, for the 'pages/index' with the '.js' suffix, the result is 'index.js'.
String Node::getTargetName(String suffix)
```

### node.unmaskTargetName

```javascript
// Unmasks the name of the node target. For example, for the 'pages/index' node and maskedTargetName='?.css', the result is 'index.css'.
String Node::unmaskTargetName(String maskedTargetName)
```

### node.resolvePath

```javascript
// Returns the full path to the target.
String Node::resolvePath(String targetName)
```

**Example**

```javascript
var fs = require('fs');
fs.writeFileSync(this.node.resolvePath(this.node.getTargetName('js')), 'alert("Hello World!");', 'utf8');
```

### node.resolveTarget

```javascript
// Alerts the node that the target is built. Optionally, accepts the build result.
// The result may be any object that can be used by other technologies in further builds.
undefined Node::resolveTarget(String targetName[, Object result])
```

**Examples**

```javascript
// #1
this.node.resolveTarget('index.css');

// #2 Receives the target name dynamically using the suffix.
this.node.resolveTarget(this.node.getTargetName('css'));

// #3 Receives the target name by unmasking the target.
this.node.resolveTarget(this.node.unmaskTargetName('?.css'));

// #4 Passes the value.
var target = this.node.unmaskTargetName('?.deps.js'),
    targetPath = this.node.resolvePath(target);
delete require.cache[targetPath]; // Avoiding caching in nodejs.
this.node.resolveTarget(target, require(targetPath));
```

### node.rejectTarget

```javascript
// Alerts the node that the target couldn't be built because of an error.
undefined Node::rejectTarget(String targetName, Error error)
```

**Examples**

```javascript
// #1
this.node.rejectTarget('index.css', new Error('Could not find CSS Tools.'));

// #2 Gets the target name dynamically using the sufix.
this.node.rejectTarget(this.node.getTargetName('css'), new Error('Could not find CSS Tools.'));
```

### node.requireSources

```javascript
// Requests the targets for the subsequent build from the node. Returns a promise.
// When the promise is executed, it returns an array of results that resolved the needed targets.
// Important: Not all technologies resolve targets with a result.
// Currently, the following technologies resolve targets with a result: levels, deps*, files.
Promise(Object[]) Node::requireSources(String[] targetNames)
```

**Example**

You need to merge `index.css` and`index.ie.css` into one file and save the result as `index.all.css`.

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
// Returns the target path relative to the node.
String Node::relativePath(String targetName)
```

### node.getDir

```javascript
// Returns the full path to the node folder.
String Node::getDir()
```

### node.getRootDir

```javascript
// Returns the full path to the root folder of the project.
String Node::getRootDir()
```

### node.getLogger

[Logger](/mdevils/enb/blob/master/lib/logger.js)

```javascript
// Returns the logger class instance for the node.
Logger Node::getLogger()
```

**Example**

```javascript
this.node.getLogger().log('Hello World');
```

### node.getNodeCache

[Cache](/mdevils/enb/blob/master/lib/cache/cache.js)

```javascript
// Returns the cache class instance for the node target.
Cache Node::getNodeCache(String targetName)
```

Caching helps you avoid repetitive builds of files that don't require building. The cache stores the modification time of the source and target files after each technology build. Caching logic is implemented individually for each technology to provide maximum flexibility.

The cache is validated with the `Boolean needRebuildFile(String cacheKey, String filePath)` and `Boolean needRebuildFileList(String cacheKey, FileInfo[] files)` methods.

The file information is saved in the cache with the `undefined cacheFileInfo(String cacheKey, String filePath)` and `undefined cacheFileList(String cacheKey, FileInfo [] files)` methods.

### node.getSharedResources

[SharedResources](../../lib/shared-resources/index.js)

Resources that can be used in technologies:

- [JobQueue](../../lib/shared-resources/job-queue/index.js) is a pool of child processes for resource-intensive tasks.

**Example**

Content of the `some-processor.js` file:

```js
module.exports = function(arg1, arg2) {
    var res = null;
    // This is where a high-load job is run. May use promises
    return res;
}
```

In the technology:

```js
var jobQueue = this.node.getSharedResources().jobQueue;
// Executes a task in a separate process. Returns a promise with the result
return jobQueue.push(require.resolve('./path/to/processor'), arg1, arg2);
```

