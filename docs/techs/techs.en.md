# Technologies for working with files

All technologies included in the ENB package are located in the `techs` package folder. They are connected from the [make file](../terms/terms.en.md) using `require('enb/techs/<tech-name>')`.

Example:

`require('enb/techs/js')`

To connect the technology to the [node](../terms/terms.en.md), specify the class and options (not required):

`nodeConfig.addTech([ require('enb/techs/<tech-name>'), {/* [options] */} ]);`

Without options:

`nodeConfig.addTech(require('enb/techs/<tech-name>'));`

To create copies of technologies for each language installed for the node or for the project (if languages for the node aren't specified), specify the `{lang}` substring in the technology options.

Example:

```javascript
nodeConfig.setLanguages(['ru', 'en', 'tk']);nodeConfig.addTech([require('js-i18n'), { target: '?.{lang}.js', lang: '{lang}' }]);
```

Equivalent to:

```javascript
nodeConfig.addTech([require('js-i18n'), { target: '?.ru.js', lang: 'ru' }]);
nodeConfig.addTech([require('js-i18n'), { target: '?.en.js', lang: 'en' }]);
nodeConfig.addTech([require('js-i18n'), { target: '?.tk.js', lang: 'tk' }]);
```

## Technologies

* [file-copy](#file-copy)
* [file-merge](#file-merge)
* [file-provider](#file-provider)
* [symlink](#symlink)
* [write-file](#write-file)

### file-copy

Copies one target to another.
You can use it to build `_?.css` from `?.css` for development mode.

**Options**

* *String* **source** — The source target. Required option.
* *String* **sourceNode** — The path to the node with the source target.
* *String* **target** — Resulting target. Required option.

**Example**

```javascript
nodeConfig.addTech([ require('enb/techs/file-copy'), {
  source: '?.css',
  target: '_?.css'
} ]);
```

### file-merge

Joins a set of files into one file.

**Options**

* *String[]* **sources** — The list of source targets. Required option.
* *String* **target** — Resulting target. Required option.
* *String* **divider** — A string for joining the files. By default, it is "\n".
* *Boolean* **sourcemap** — Creates source maps with information about the source files.

**Example**

```javascript
nodeConfig.addTech([ require('enb/techs/file-merge'), {
    sources: ['?.bemhtml', '?.pre.js']
    target: '?.js'
} ]);
```

### file-provider

Provides an existing file for the make platform.
You can use it to provide the original * bemdecl*file.

**Options**

* *String* **target** — The target. Required option.

**Example**

```javascript
nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);
```

### symlink

Creates a symlink from one target to another. You can use it to build `_?.css` from `?.css` for development mode.

**Options**

* *String* **fileTarget** — The source target. Required option.
* *String* **symlinkTarget** — Resulting target. Required option.

**Example**

```javascript
nodeConfig.addTech([ require('enb/techs/symlink'), {
  fileTarget: '?.css',
  symlinkTarget: '_?.css'
} ]);
```

### write-file

Saves the target file in the file system.

**Options**

* *String* **target** — The name of the file to generate. Required option.
* *String | Buffer* **content** — Content of the file to generate. If specified, the file will be generated.
* *Object | String* **fileOptions** - [аттрибуты генерируемого файла]{@link https://goo.gl/ZZzrdr} (default: 'utf8')

**Example**

Generating a text file

```javascript
nodeConfig.addTech([ require('enb/techs/write-file'), {
    content: 'bla bla bla',
    fileOptions: {
        encoding: 'utf8', // default
        mode: '0o666', // default
        flag: 'w' //default
        },
    target: '?.bla.txt'
} ]);
```

Generating the `bemdecl` file

```javascript
nodeConfig.addTech([ require('enb/techs/write-file'), {
    content: 'exports.blocks = {name: "bla"}',
    fileOptions: {
        encoding: 'utf8', // default
        mode: '0o666', // default
        flag: 'w' //default
        },
    target: '?.bemdecl.js'
} ]);
```
