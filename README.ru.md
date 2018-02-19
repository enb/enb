# ENB

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Windows Status][appveyor-img]][appveyor]
[![Coverage Status][coveralls-img]][coveralls]
[![Dependency Status][david-img]][david]

[npm]:           http://www.npmjs.org/package/enb
[npm-img]:       https://img.shields.io/npm/v/enb.svg

[travis]:        https://travis-ci.org/enb/enb
[test-img]:      https://img.shields.io/travis/enb/enb/master.svg?label=tests

[appveyor]:      https://ci.appveyor.com/project/blond/enb
[appveyor-img]:  https://img.shields.io/appveyor/ci/blond/enb/master.svg?label=windows

[coveralls]:     https://coveralls.io/r/enb/enb?branch=master
[coveralls-img]: https://img.shields.io/coveralls/enb/enb/master.svg

[david]:         https://david-dm.org/enb/enb
[david-img]:     https://img.shields.io/david/enb/enb/master.svg

Инструмент для сборки веб-проектов, построенных по [методологии БЭМ](https://ru.bem.info/methodology/).

## Введение

Основная задача ENB — сборка исходных файлов в [бандлы](https://github.com/bem-site/bem-method/blob/bem-info-data/method/build/build.ru.md#Введение), обычно для дальнейшего их использования в браузере.

Сборка включает в себя объединение исходных файлов, их обработку и преобразование кода, а также подготовку или упаковку ресурсов (изображения, шрифты и т.д.).

> Подробнее читайте о [сборка БЭМ-проектов](https://ru.bem.info/methodology/build/) на сайте [bem.info](https://ru.bem.info/).

### Основные возможности ENB

* Поиск только необходимых исходных файлов для сборки.
* Подключение необходимых исходных файлов по декларациям зависимостей.
* Определение порядка подключения исходных файлов.
* Объединение исходных файлов, разложенных по файловой структуре проекта.
* Создание бандлов и файлов.
* Расширение сборки для обработки и преобразования с учетом особенностей вашего проекта.
* Предоставление сервиса для локальной разработки с поддержкой пересборки по требованию.

## Установка

```shell
$ npm install --save-dev enb
```

## С чего начать?

Чтобы создать БЭМ-проект, настроенный для сборки с помощью [ENB](https://ru.bem.info/toolbox/enb/), воспользуйтесь любым из предложенных вариантов:

1. Установите шаблонный проект [project-stub](https://ru.bem.info/platform/project-stub/), который поддерживает сборку с помощью [ENB](https://ru.bem.info/toolbox/enb/) по умолчанию.
1. Создайте проект, подходящий под ваши задачи. Для этого ответьте на вопросы [генератора БЭМ-проектов](https://github.com/bem-archive/generator-bem-stub/), основанного на [Yeoman](http://yeoman.io/).

## Документация

* *`[устаревшая]`* [Руководство сборки проекта](./docs/guides/build-project/build-project.ru.md)
* [Сборка бандла](https://github.com/enb/enb-bem-techs/blob/master/docs/build-bundle/build-bundle.ru.md)
* [Сборка страницы](https://github.com/enb/enb-bem-techs/blob/master/docs/build-page/build-page.ru.md)
* [Сборка merged-бандла](https://github.com/enb/enb-bem-techs/blob/master/docs/build-merged-bundle/build-merged-bundle.ru.md)
* [Сборка дистрибутива](https://github.com/enb/enb-bem-techs/blob/master/docs/build-dist/build-dist.ru.md)
* *`[устаревшая]`* [Руководство сборки с помощью express](./docs/guides/express/express.ru.md)
* *`[устаревшая]`* [Руководство по написанию ENB-технологии](./docs/guides/write-tech/write-tech.ru.md)
* [Терминология](./docs/terms/terms.ru.md)
* *`[устаревшая]`* [API](./docs/api/api.ru.md)
* *`[устаревшая]`* [CLI](./docs/cli/cli.ru.md)

## Материалы

* [Организация файловой структуры](https://ru.bem.info/methodology/filestructure/)
* [Сборка БЭМ-проекта](https://ru.bem.info/methodology/build/)
* [Уровни переопределения](https://ru.bem.info/methodology/redefinition-levels/)
* [Декларации в БЭМ](https://ru.bem.info/methodology/declarations/)

## Расширения

> Пакеты ENB-технологий находятся в [NPM](https://www.npmjs.com): [пакеты с префиксом `enb-`](https://www.npmjs.com/search?q=enb).

| Название | Статус | Описание |
| -------- | ------ | -------- |
| **БЭМ-методологии** |||
[BEM](https://github.com/enb/enb-bem-techs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-techs.svg)](https://www.npmjs.org/package/enb-bem-techs) | Технологии для сборки БЭМ-проектов.
[BEViS](https://github.com/enb-make/enb-bevis) | [![NPM version](https://img.shields.io/npm/v/enb-bevis.svg)](https://www.npmjs.org/package/enb-bevis) | Технологии для сборки BEViS-проектов.
| **Шаблонизация** |||
[bem-xjst](https://github.com/enb/enb-bemxjst) | [![NPM version](https://img.shields.io/npm/v/enb-bemxjst.svg)](https://www.npmjs.org/package/enb-bemxjst) | Сборка BEMTREE- и BEMHTML-шаблонов с помощью [bem-xjst](https://github.com/bem/bem-xjst).
[xjst](https://github.com/enb/enb-xjst) | [![NPM version](https://img.shields.io/npm/v/enb-xjst.svg)](https://www.npmjs.org/package/enb-xjst) | Сборка BEMTREE- и BEMHTML-шаблонов с помощью [XJST](https://github.com/veged/xjst).
[bh](https://github.com/enb/enb-bh) | [![NPM version](https://img.shields.io/npm/v/enb-bh.svg)](https://www.npmjs.org/package/enb-bh) | Сборка BH-шаблонов.
[bt](https://github.com/enb/enb-bt) | [![NPM version](https://img.shields.io/npm/v/enb-bt.svg)](https://www.npmjs.org/package/enb-bt) | Сборка BT-шаблонов.
| **Стили** |||
[CSS](https://github.com/enb/enb-css) | [![NPM version](https://img.shields.io/npm/v/enb-css.svg)](https://www.npmjs.org/package/enb-css) | Сборка и минимизация CSS-файлов.
[PostCSS](https://github.com/enb/enb-postcss) | [![NPM version](https://img.shields.io/npm/v/enb-postcss.svg)](https://www.npmjs.org/package/enb-postcss) | Сборка и обработка CSS-файлов с помощью [postcss](https://github.com/postcss/postcss).
[Stylus](https://github.com/enb/enb-stylus) | [![NPM version](https://img.shields.io/npm/v/enb-stylus.svg)](https://www.npmjs.org/package/enb-stylus) | Сборка и минимизация Stylus-файлов.
[Saas](https://github.com/enb/enb-sass) | [![NPM version](https://img.shields.io/npm/v/enb-sass.svg)](https://www.npmjs.org/package/enb-sass) | Сборка Sass-файлов.
[Roole](https://github.com/enb/enb-roole) | [![NPM version](https://img.shields.io/npm/v/enb-roole.svg)](https://www.npmjs.org/package/enb-roole) | Сборка roo-файлов.
| **JavaScript** |||
[JavaScript](https://github.com/enb/enb-js) | [![NPM version](https://img.shields.io/npm/v/enb-js.svg)](https://www.npmjs.org/package/enb-js) | Сборка, обработка и минимизация JS-файлов.
[YModules](https://github.com/enb/enb-modules) | [![NPM version](https://img.shields.io/npm/v/enb-modules.svg)](https://www.npmjs.org/package/enb-modules) | Сборка JS-файлов c [YModules](https://github.com/ymaps/modules).
| **Инфраструктура** |||
[Examples](https://github.com/enb/enb-bem-examples) | [![NPM version](https://img.shields.io/npm/v/enb-bem-examples.svg)](https://www.npmjs.org/package/enb-bem-examples) | Сборка БЭМ-примеров.
[Docs](https://github.com/enb/enb-bem-docs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-docs.svg)](https://www.npmjs.org/package/enb-bem-docs) | Сборка БЭМ-документации.
[Browser tests](https://github.com/enb/enb-bem-specs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-specs.svg)](https://www.npmjs.org/package/enb-bem-specs) | Сборка и запуск тестов для клиентского JavaScript.
[Node tests](https://github.com/enb/enb-bem-node-specs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-node-specs.svg)](https://www.npmjs.org/package/enb-bem-node-specs) | Сборка и запуск тестов для БЭМ-шаблонов.
[Template tests](https://github.com/enb/enb-bem-tmpl-specs) | [![NPM version](https://img.shields.io/npm/v/enb-bem-tmpl-specs.svg)](https://www.npmjs.org/package/enb-bem-tmpl-specs) | Сборка и запуск тестов для БЭМ-шаблонов.

## Лицензия

© 2013 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
