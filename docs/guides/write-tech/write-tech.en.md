# How to write your own technology

Starting with ENB version 0.8, we recommend using the `BuildFlow` helper for writing technologies.

[The helper source code](https://github.com/enb/enb/blob/master/lib/build-flow.js)

This guide doesn't cover all `BuildFlow` features. For a complete list of methods with descriptions, see the JSDoc file `build-flow.js`.

## Theory

A technology is aimed at building a [target](../../terms/terms.en.md) in the node. For example, the `css` technology can build `index.css` in the `pages/index` node from the `css` files for the [redefinition levels](https://en.beta.bem.info/methodology/key-concepts/#redefinition-level).

Each technology can accept settings.
The `BuildFlow` helper ensures that the maximum number of parameters is customizable.

Technologies can use the result of other technologies. For example, the list of source `css` files is built using the `files` technology.

## Technology for combining files by suffix

In general, the technology for combining files with a certain suffix looks like this:

```javascript
module.exports = require('enb/lib/build-flow').create() // Creates a  BuildFlow instance
    .name('js') // Choose the technology name
    .target('target', '?.js') // Name of the option that sets the name for the output file and the default value
    .useFileList('js') // Specify the suffixes for the build
    .justJoinFilesWithComments() // One more helper. Joins the result and wraps it in /* ... */ comments
                                 // The comments contain the path to the file from which the fragment was formed.
    .createTech(); // Creates the technology with the helper
```

Consider a similar technology that doesn't use `justJoinFilesWithComments`:

```javascript
var Vow = require('vow'); // Promise library used in ENB
var vowFs = require('vow-fs'); // Using Vow to work with file system

module.exports = require('enb/lib/build-flow').create()
    .name('js')
    .target('target', '?.js')
    .useFileList('js')
    .builder(function(jsFiles) { // Returns the promise for ENB to wait until the asynchronous technology is executed
        var node = this.node; // Saves the link to the `Node` class instance.
        return Vow.all(jsFiles.map(function(file) { // Waits until the promises are resolved
            return vowFs.read(file.fullname, 'utf8').then(function(data) { // Reads each source file
                var filename = node.relativePath(file.fullname); // Receives the path from the node
                // Builds fragments from the source file content
                return '/* begin: ' + filename + ' *' + '/\n' + data + '\n/* end: ' + filename + ' *' + '/';
            });
        })).then(function(contents) { // Received the result of processing all source files
            return contents.join('\n'); // Joins the received fragments using the line feed
        });
    })
    .createTech();
```

Since we used the `useFileList` method, the `builder` received an argument with a list of files for the specified suffix.
Each `use` method adds an argument to the `builder`. The type and content of the arguments depend on which `use` method is used.

Let's add internationalization files to the resulting technology:

```javascript
var Vow = require('vow'); // The promise library used in ENB
var vowFs = require('vow-fs'); // Using Vow to work with the file system

module.exports = require('enb/lib/build-flow').create()
    .name('js')
    .target('target', '?.js')
    .defineRequiredOption('lang') // Defines the required 'lang' option to set the language
    .useFileList('js')

    .useSourceText('allLangTarget', '?.lang.all.js') // Connects internationalization common for all languages,
                                                     // using the useSourceText, that adds the content of the specified source file
                                                     // to the builder as an argument

    .useSourceText('langTarget', '?.lang.{lang}.js') // Connects the keysets of the specified language;
                                                     // here the lang option value is used to
                                                     // form the default value

    .builder(function(jsFiles, allLangText, langText) {
        var node = this.node;
        return Vow.all(jsFiles.map(function(file) {
            return vowFs.read(file.fullname, 'utf8').then(function(data) {
                var filename = node.relativePath(file.fullname);
                return '/* begin: ' + filename + ' *' + '/\n' + data + '\n/* end: ' + filename + ' *' + '/';
            });
        })).then(function(contents) {
            return contents
                .concat([allLangText, langText]) // Adds content fragments from internationalization files
                .join('\n');
        });
    })
    .createTech();
```

## Technology for joining multiple targets

Consider a ready-made example:

```javascript
// This example builds a localized priv.js
module.exports = require('enb/lib/build-flow').create()
    .name('priv-js-i18n')
    .target('target', '?.{lang}.priv.js')
    .defineRequiredOption('lang')

    // All the targets are prepared by other technologies:

    .useSourceFilename('allLangTarget', '?.lang.all.js') // Sets the dependency from the name of the
                                                         // common internationalization file

    .useSourceFilename('langTarget', '?.lang.{lang}.js') // Sets the dependency from the name of the
                                                         // specific language  file

    .useSourceFilename('privJsTarget', '?.priv.js') // Sets the dependency from the name of the
                                                    // priv-js file

    .justJoinFilesWithComments() // Uses the helper to join the files

    .createTech();
```

Joining without the helper:

```javascript
module.exports = require('enb/lib/build-flow').create()
    .name('priv-js-i18n')
    .target('target', '?.{lang}.priv.js')
    .defineRequiredOption('lang')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .useSourceFilename('privJsTarget', '?.priv.js')

    .builder(function(allLangFilename, langFilename, privJsFilename) {
        var node = this.node;
        // Iterates through the source files
        return Vow.all([allLangFilename, langFilename, privJsFilename].map(function(absoluteFilename) {
            // Reads each source file
            return vowFs.read(absoluteFilename, 'utf8').then(function(data) {
                // Receives a relative file path
                var filename = node.relativePath(absoluteFilename);

                // Forms a fragment
                return '/* begin: ' + filename + ' *' + '/\n' + data + '\n/* end: ' + filename + ' *' + '/';
            });
        })).then(function(contents) {
            return contents.join('\n'); // Combines the fragments
        });
    })

    .createTech();
```

## Dependencies from the files not included in the build

If you need to add a modular system in the beginning of a file and save the result with a new name:

```javascript
var vowFs = require('vow-fs'); // Connects the module for working with the file system
var path = require('path'); // Connects utilities for working with paths

module.exports = require('enb/lib/build-flow').create()
    .name('prepend-modules')
    .target('target', '?.js')
    .defineRequiredOption('source') // Specifies the required option
    .useSourceText('source', '?') // Sets the dependency from the content of the target defined by the 'source' option
    .needRebuild(function(cache) { // Specifies an additional cache check
        // In this case, the modular system isn't located at the source redefinition levels,
        // but it can be found in the 'ym' package; for the rebuild to work correctly if
        // the modules.js content changes, add the check
        this._modulesFile = path.join(__dirname, '..', 'node_modules', 'ym', 'modules.js'); // Forms the path
        return cache.needRebuildFile( // Checks if the file changed
            'modules-file', // Key for caching the file information; must be unique within the technology
            this._modulesFile // Path to the file for which the cache should be checked
        );
    })
    .saveCache(function(cache) { // Saves the cache data in the used file
        cache.cacheFileInfo( // Saves the file information
            'modules-file', // Key for caching the file information; must be unique within the technology
            this._modulesFile // Path to the file for which the cache should be checked
        );
    })
    .builder(function(preTargetSource) {
        // Reads the content of the modular system file
        return vowFs.read(this._modulesFile, 'utf8').then(function(modulesRes) {
            return modulesRes + preTargetSource; // Joins the results
        });
    })
    .createTech();
```

### Creating a new technology from an existing one

Sometimes you need to to extend existing technologies.

Every technology made with `BuildFlow` contains the `buildFlow()` method that can be called to create a new technology from the functionality of the existing one.

For example, there is a `css` technology:

```javascript
module.exports = require('enb/lib/build-flow').create()
    .name('css')
    .target('target', '?.css')
    .useFileList('css')
    .builder(function(cssFiles) {
        // ...
    })
    .methods({
        // ...
    })
    .createTech();
```

To build `light.css` suffixes together with `css` suffixes, you need to write a new technology that borrows the functionality of the old one:

```javascript
module.exports = require('enb/techs/css').buildFlow()
    .name('css-light') // Changes the name
    .useFileList(['css', 'light.css']) // Changes the necessary parameters
    .createTech();
```
