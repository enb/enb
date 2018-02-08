# ENB

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Windows Status][appveyor-img]][appveyor]
[![Coverage Status][coveralls-img]][coveralls]
[![Dependency Status][david-img]][david]

[npm]: http://www.npmjs.org/package/enb
[npm-img]: https://img.shields.io/npm/v/enb.svg
[travis]: https://travis-ci.org/enb/enb
[test-img]: https://img.shields.io/travis/enb/enb/master.svg?label=tests
[appveyor]: https://ci.appveyor.com/project/blond/enb
[appveyor-img]: https://img.shields.io/appveyor/ci/blond/enb/master.svg?label=windows
[coveralls]: https://coveralls.io/r/enb/enb?branch=master
[coveralls-img]: https://img.shields.io/coveralls/enb/enb/master.svg
[david]: https://david-dm.org/enb/enb
[david-img]: https://img.shields.io/david/enb/enb/master.svg
The tool for building web projects created with the [BEM methodology](https://en.bem.info/methodology).

## Introduction

The main purpose of ENB is to combine source files into [bundles](https://github.com/bem-site/bem-method/blob/bem-info-data/method/build/build.en.md#introduction), usually for further use in the browser.

The build includes combining all source files, processing them and converting the code, as well as preparing and packing the resources (images, fonts, and so on).

> Read more about [building BEM projects](https://en.bem.info/methodology/build/) on the [bem.info](https://en.bem.info/) site.

### Basic features of ENB

* Searches for only those source files needed for the build.
* Connects the necessary source files based on dependency declarations.
* Defines the order of connecting the source files.
* Combines source files spread across the project's file system.
* Creates bundles and files.
* Extends the build for project-specific processing and conversion.
* Provides a local development service that supports builds on demand.

## Installation

```shell
$ npm install --save-dev enb
```

## Getting started

To create a BEM project configured for the build with [ENB](https://en.bem.info/toolbox/enb/), use one of these options:

1. Install a [project-stub](https://en.bem.info/platform/project-stub/) template project that supports [ENB](https://en.bem.info/toolbox/enb/) builds by default.
1. Create a project that suits your tasks. To do this, answer the questions in the [BEM project generator](https://github.com/bem-archive/generator-bem-stub/) based on [Yeoman](http://yeoman.io/).

## Documentation

* *`[deprecated]`* [Project build guide](./docs/guides/build-project/build-project.en.md)
* [Building a bundle](https://github.com/enb/enb-bem-techs/blob/master/docs/build-bundle/build-bundle.en.md)
* [Building a page](https://github.com/enb/enb-bem-techs/blob/master/docs/build-page/build-page.en.md)
* [Building a merged bundle](https://github.com/enb/enb-bem-techs/blob/master/docs/build-merged-bundle/build-merged-bundle.en.md)
* [Building a distribution](https://github.com/enb/enb-bem-techs/blob/master/docs/build-dist/build-dist.en.md)
* *`[deprecated]`* [Building with express](./docs/guides/express/express.en.md)
* *`[deprecated]`* [Guide to writing an ENB technology](./docs/guides/write-tech/write-tech.en.md)
* [Terminology](./docs/terms/terms.en.md)
* *`[deprecated]`* [API](./docs/api/api.en.md)
* *`[deprecated]`* [CLI](./docs/cli/cli.en.md)

## Materials

* [File structure organization](https://en.bem.info/methodology/filestructure/)
* [Building a BEM project](https://en.bem.info/methodology/build/)
* [Redefinition levels](https://en.bem.info/methodology/redefinition-levels/)
* [Declarations in BEM](https://en.bem.info/methodology/declarations/)

## Extensions

> ENB technology packages are located in [NPM](https://www.npmjs.com): [packages with the `enb` prefix](https://www.npmjs.com/search?q=enb).

| Name | Status | Description |
| -------- | ------ | -------- |
| **BEM methodologies** |
| [BEM](https://github.com/enb/enb-bem-techs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-techs.svg)](https://www.npmjs.org/package/enb-bem-techs) | Technologies for building BEM projects. |
| [BEViS](https://github.com/enb-make/enb-bevis) | [![NPM version](https://img.shields.io/npm/v/enb-bevis.svg)](https://www.npmjs.org/package/enb-bevis) | Technologies for building BEViS projects. |
| **Templating** |
| [bem-xjst](https://github.com/enb/enb-bemxjst) | [![NPM version](https://img.shields.io/npm/v/enb-bemxjst.svg)](https://www.npmjs.org/package/enb-bemxjst) | Building BEMTREE and BEMHTML templates with [bem-xjst](https://github.com/bem/bem-xjst). |
| [xjst](https://github.com/enb/enb-xjst) | [![NPM version](https://img.shields.io/npm/v/enb-xjst.svg)](https://www.npmjs.org/package/enb-xjst) | Building BEMTREE and BEMHTML templates with [XJST](https://github.com/veged/xjst). |
| [bh](https://github.com/enb/enb-bh) | [![NPM version](https://img.shields.io/npm/v/enb-bh.svg)](https://www.npmjs.org/package/enb-bh) | Building BH templates. |
| [bt](https://github.com/enb/enb-bt) | [![NPM version](https://img.shields.io/npm/v/enb-bt.svg)](https://www.npmjs.org/package/enb-bt) | Building BT templates. |
| **Styles** |
| [CSS](https://github.com/enb/enb-css) | [![NPM version](https://img.shields.io/npm/v/enb-css.svg)](https://www.npmjs.org/package/enb-css) | Building and minimizing CSS files. |
| [PostCSS](https://github.com/enb/enb-postcss) | [![NPM version](https://img.shields.io/npm/v/enb-postcss.svg)](https://www.npmjs.org/package/enb-postcss) | Building and processing CSS files with [postcss](https://github.com/postcss/postcss). |
| [Stylus](https://github.com/enb/enb-stylus) | [![NPM version](https://img.shields.io/npm/v/enb-stylus.svg)](https://www.npmjs.org/package/enb-stylus) | Building and minimizing Stylus files. |
| [Saas](https://github.com/enb/enb-sass) | [![NPM version](https://img.shields.io/npm/v/enb-sass.svg)](https://www.npmjs.org/package/enb-sass) | Building Sass files. |
| [Roole](https://github.com/enb/enb-roole) | [![NPM version](https://img.shields.io/npm/v/enb-roole.svg)](https://www.npmjs.org/package/enb-roole) | Building roo files. |
| **JavaScript** |
| [JavaScript](https://github.com/enb/enb-js) | [![NPM version] (https://img.shields.io/npm/v/enb-js.svg)](https://www.npmjs.org/package/enb-js) | Building, processing and minimizing JS files. |
| [YModules](https://github.com/enb/enb-modules) | [![NPM version](https://img.shields.io/npm/v/enb-modules.svg)](https://www.npmjs.org/package/enb-modules) | Building JS files with [YModules](https://github.com/ymaps/modules). |
| **Public facilities** |
| [Examples](https://github.com/enb/enb-bem-examples) | [![NPM version](https://img.shields.io/npm/v/enb-bem-examples.svg)](https://www.npmjs.org/package/enb-bem-examples) | Building BEM examples. |
| [Docs](https://github.com/enb/enb-bem-docs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-docs.svg)](https://www.npmjs.org/package/enb-bem-docs) | Building BEM documentation. |
| [Browser tests](https://github.com/enb/enb-bem-specs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-specs.svg)](https://www.npmjs.org/package/enb-bem-specs) | Building and running tests for client-side JavaScript. |
| [Node tests](https://github.com/enb/enb-bem-node-specs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-node-specs.svg)](https://www.npmjs.org/package/enb-bem-node-specs) | Building and running tests for BEM templates. |
| [Template tests](https://github.com/enb/enb-bem-tmpl-specs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-tmpl-specs.svg)](https://www.npmjs.org/package/enb-bem-tmpl-specs) | Building and running tests for BEM templates. |

## License

© 2013 YANDEX LLC. The code is released under the [Mozilla Public License 2.0](LICENSE.txt).

