# How to build a project

* [Build process](#the-build-process)
* [Step-by-step guide](#step-by-step-guide)
* [Build configuration](#build-configuration)
* [Build on demand](#on-demand-build)

## The build process

1. ENB determines which [targets](../../terms/terms.en.md) are built (the `enb make [target]` command). If `enb make` is run without a specified target, ENB builds all targets defined in `make.js`.
2. ENB initializes the [nodes](../../terms/terms.en.md) involved in the build for the specified targets. Each node requests the list of targets from technologies registered inside the node.
3. The node launches technologies responsible for the targets to build.
4. During execution, a technology can request other targets needed for the build from the node (the `requireSources` method). In this case, the current technology is suspended until the needed targets are built.
5. The technology alerts the node (the `resolveTarget` method) when it completes the target build.
6. The build is completed when all needed targets are built.

## Step by step guide

1. Add the `enb` package dependency in the project's `package.json` (preferably as ">=latest_version")
2. Run `npm install`.
3. Make sure that ENB is installed.
The `node_modules/.bin/enb` command must run without errors.
4. Create a [make file](../../terms/terms.en.md) `.bem/enb-make.js` in the format:

```javascript
module.exports = function(config) {
};
```

5. Make sure ENB runs correctly.
The `node_modules/.bin/enb make` command should run without errors.
6. Configure the nodes.
The example shows the `pages/index` node configuration.

```javascript
module.exports = function(config) {
    config.node('pages/index', function(nodeConfig) {
    });
};
```

This is how the node is declared on the make platform. At this point, the node isn't configured – it's just declared.

7. Declare the targets to build for the node:

```javascript
module.exports = function(config) {
    config.node('pages/index', function(nodeConfig) {
      nodeConfig.addTargets(['_?.js', '_?.css']);
    });
};
```

The targets are declared. But running `node_modules/bin/enb make` will return an error because the technologies that can provide the targets aren't registered.

8. Register the basic technologies:

```javascript
module.exports = function(config) {
    config.node('pages/index', function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/levels'), { levels: getLevels(config) } ],
        [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
        require('enb/techs/deps-old'),
        require('enb/techs/files')
      ]);

      nodeConfig.addTargets(['_?.js', '_?.css']);
    });
};

function getLevels(config) {
    return [
      {path: 'bem-bl/blocks-common', check: false},
      {path: 'bem-bl/blocks-desktop', check: false},
      {path: 'lego/blocks-common', check: false},
      {path: 'lego/blocks-desktop', check: false},
      'common.blocks',
      'desktop.blocks'
    ].map(function(levelPath) { return config.resolvePath(levelPath); });
}
```

To keep the node configuration clear, the `getLevels` function is placed at the bottom of the file.

**More information about each technology:**

**enb/techs/levels** — Collects information about the project's redefinition levels. The result of this technology is used by the `enb/techs/deps`, `enb/techs/deps-old` and `enb/techs/files` technologies. For each node, a default `<path_to_node>/blocks` level is added. For example, for the `pages/index` node, the default level is `pages/index/blocks`.

**enb/techs/file-provider** — Informs the make platform that the target passed in the `target` option is ready. In our case, the source file for the build is `index.bemdecl.js`. It is located in the repository and doesn't require separate building.

**enb/techs/deps-old** — Builds `?.deps.js` (`index.deps.js`) from `index.bemdecl.js` and `index.levels`. Why `deps-old`? Lego lacks a number of dependencies, so your project may fail to build with the faster `deps` technology if you don't modify lego. The `deps-old` technology uses the build algorithm from `bem-tools`, and the lack of dependencies isn't an issue.

**enb/techs/files** — Collects the full list of files from all redefinition levels in the order they are included in the final `index.deps.js`. The result of this technology can be used, for example, in the `enb/techs/js` technology.

9. Register the technologies needed to build JavaScript and CSS.

```javascript
module.exports = function(config) {
    config.node('pages/index', function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/levels'), { levels: getLevels(config) } ],
        [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
        require('enb/techs/deps-old'),
        require('enb/techs/files'),
        require('enb/techs/js'),
        require('enb/techs/css')
      ]);

      nodeConfig.addTargets(['_?.js', '_?.css']);
    });
};

function getLevels(config) {
    return [
      {path: 'bem-bl/blocks-common', check: false},
      {path: 'bem-bl/blocks-desktop', check: false},
      {path: 'lego/blocks-common', check: false},
      {path: 'lego/blocks-desktop', check: false},
      'common.blocks',
      'desktop.blocks'
    ].map(function(levelPath) { return config.resolvePath(levelPath); });
}
```

Now you can build the `index.js` and `index.css` files using the `enb/techs/js` and `enb/techs/css` technologies.
But at step 7, we registered other targets: `_?.js` (`_index.js`) and `_?.css` (`_index.css`). To build them, use the `enb/techs/file-copy` technology.

```javascript
module.exports = function(config) {
    config.node('pages/index', function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/levels'), { levels: getLevels(config) } ],
        [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
        require('enb/techs/deps-old'),
        require('enb/techs/files'),
        require('enb/techs/js'),
        require('enb/techs/css'),
        [ require('enb/techs/file-copy'), { sourceTarget: '?.js', destTarget: '_?.js' } ],
        [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '_?.css' } ]
      ]);

      nodeConfig.addTargets(['_?.js', '_?.css']);
    });
};

function getLevels(config) {
    return [
      {path: 'bem-bl/blocks-common', check: false},
      {path: 'bem-bl/blocks-desktop', check: false},
      {path: 'lego/blocks-common', check: false},
      {path: 'lego/blocks-desktop', check: false},
      'common.blocks',
      'desktop.blocks'
    ].map(function(levelPath) { return config.resolvePath(levelPath); });
}
```

Now run the `node_modules/.bin/enb make` command and all necessary `_index.js` and `_index.css` files will be added to the `pages/index` folder.
This gives us a result we can work with. But it isn't enough for the production mode.

10. Divide up the build of the final files for different modes.

```javascript
module.exports = function(config) {
    config.node('pages/index', function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/levels'), { levels: getLevels(config) } ],
        [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
        require('enb/techs/deps-old'),
        require('enb/techs/files'),
        require('enb/techs/js'),
        require('enb/techs/css')
      ]);

      nodeConfig.mode('development', function(nodeConfig) {
        nodeConfig.addTechs([
          [ require('enb/techs/file-copy'), { sourceTarget: '?.js', destTarget: '_?.js' } ],
          [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '_?.css' } ]
        ]);
      });

      nodeConfig.mode('production', function(nodeConfig) {
        nodeConfig.addTechs([
          [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.js', destTarget: '_?.js', minify: true } ],
          [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.css', destTarget: '_?.css', minify: true } ]
        ]);
      });

      nodeConfig.addTargets(['_?.js', '_?.css']);
    });
};

function getLevels(config) {
    return [
      {path: 'bem-bl/blocks-common', check: false},
      {path: 'bem-bl/blocks-desktop', check: false},
      {path: 'lego/blocks-common', check: false},
      {path: 'lego/blocks-desktop', check: false},
      'common.blocks',
      'desktop.blocks'
    ].map(function(levelPath) { return config.resolvePath(levelPath); });
}
```

Now the final files for the production mode are processed with [Borschik](https://github.com/bem/borschik). The production mode is started with the `YENV=production node_modules/.bin/enb make` command.

11. Building `node_modules/.bin/enb make`.

### Build configuration

```javascript
module.exports = function(config) {

  // Languages for the project.
  config.setLanguages(['ru', 'en']);

  // Adding a node set to the build.
  config.nodes('pages/*');

  // Adding the node to the build + configuring the node.
  config.node('pages/index', function(nodeConfig) {
    // Redefining languages for a particular node.
    nodeConfig.setLanguages(['ru']);

    // Adding a single technology with options.
    nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);

    // Adding multiple technologies.
    nodeConfig.addTechs([
      [ require('enb/techs/levels'), {
        levels: [
          'common.blocks',
          'desktop.blocks'
        ].map(function(config) { return config.resolvePath(level); }) // Resolving paths from the project root.
      }],
      require('enb/techs/deps'),
      require('enb/techs/files'),

      // Adding a technology with options
      [ require('enb/techs/js'), { target: '?.new.js' } ],
      require('enb/techs/css')
    ]);

    // Adding one target.
    nodeConfig.addTarget('?.css');

    // Adding multiple targets.
    nodeConfig.addTargets(['?.css', '?.js']);
  });

  // Development mode configuration.
  config.mode('development', function() {
    // Node configuration by mask (regex).
    config.nodeMask(/pages\/.*/, function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '_?.css'} ],
        [ require('enb/techs/file-copy'), { sourceTarget: '?.js', destTarget: '_?.js'} ]
      ]);
    });
  });

  // Production mode configuration.
  config.mode('production', function() {
    // Node configuration by mask (regex).
    config.nodeMask(/pages\/.*/, function(nodeConfig) {
      nodeConfig.addTechs([
        [ require('enb/techs/borschik'), { sourceTarget: '?.css', destTarget: '_?.css'} ],
        [ require('enb/techs/borschik'), { sourceTarget: '?.js', destTarget: '_?.js'} ]
      ]);
    });
  });

  // Task registration.
  config.task('i18n.get', function(task) {
    // Running the shell command.
    return task.shell('./blocks/lego/tools/get-tanker.js');
  });

  // Installing environment variables for shell commands.
  config.setEnv({
      PRJ_ROOT        : config.resolvePath(), // Recieving an absolute path to the project folder.
      TANKER_HOST     : 'tanker-test.yandex-team.ru',
      TANKER_PRJ      : 'super-project',
      TANKER_PRJ_REV  : 'master'
  });
};
```

### On-demand build

Apart from building static files in the `dev` mode using ENB in `express` applications,
you can build various resources, such as templates, on demand.

If the `Node.js` application needs to build templates or localization (or something else), you can use the `createBuilder` method of the `lib/server/server-middleware` module.

```javascript
/**
 * @param {Object} options
 * @param {String} options.cdir The root directory of the project.
 * @param {Boolean} options.noLog Don't log the build process in the console.
 * @returns {Function}
 */
module.exports.createBuilder = function(options) { /* ... */ };
```

Usage example:

```javascript
var clearRequire = require('clear-require');
var enbBuilder = require('enb/lib/server/server-middleware').createBuilder();
app
    .get('/', function (req, res, next) {
        var bemhtmlFilePath = 'pages/index/index.bemhtml.js';
        enbBuilder(bemhtmlFilePath).then(function() {
            var bemhtmlAbsFilePath = process.process.cwd() + '/' + bemhtmlFilePath;
            clearRequire(bemhtmlAbsFilePath);
            var bemhtml = require(bemhtmlAbsFilePath);
            res.end(bemhtml.BEMHTML.apply({block: 'b-page', content: 'Hello World'}));
            next();
        }, next);
    });
```
