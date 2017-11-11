Технологии для работы с файлами
===============================

Все технологии, включенные в пакет `ENB`, находятся в папке `techs` пакета. Подключаются из make-файла с помощью `require('enb/techs/<tech-name>')`. Например, `require('enb/techs/js')`. Подключаются к ноде указанием класса и опций: `nodeConfig.addTech([ require('enb/techs/<tech-name>'), {/* [options] */} ]);`, либо без опций: `nodeConfig.addTech(require('enb/techs/<tech-name>'));`.

Если при настройке технологии в опциях указана подстрока `{lang}`, то будет создано столько копий технологии, сколько языков установлено для ноды или проекта (если у ноды не указаны языки).

Например:

```javascript
nodeConfig.setLanguages(['ru', 'en', 'tk']);
nodeConfig.addTech([require('js-i18n'), { target: '?.{lang}.js', lang: '{lang}' }]);
```

Эквивалентно:

```javascript
nodeConfig.addTech([require('js-i18n'), { target: '?.ru.js', lang: 'ru' }]);
nodeConfig.addTech([require('js-i18n'), { target: '?.en.js', lang: 'en' }]);
nodeConfig.addTech([require('js-i18n'), { target: '?.tk.js', lang: 'tk' }]);
```

file-copy
---------

Копирует один таргет в другой.
Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.

**Опции**

* *String* **sourceTarget** — Исходный таргет. Обязательная опция.
* *String* **destTarget** — Результирующий таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-copy'), {
  sourceTarget: '?.css',
  destTarget: '_?.css'
} ]);
```

file-merge
----------

Склеивает набор файлов в один.

**Опции**

* *String[]* **sources** — Список исходных таргетов. Обязательная опция.
* *String* **target** — Результирующий таргет. Обязательная опция.
* *String* **divider** — Строка для склеивания файлов. По умолчанию — "\n".
* *Boolean* **sourcemap** — Построение карт кода (source maps) с информацией об исходных файлах.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-merge'), {
    sources: ['?.bemhtml', '?.pre.js']
    target: '?.js'
} ]);
```

file-provider
-------------

Предоставляет существующий файл для make-платформы.
Может, например, использоваться для предоставления исходного *bemdecl*-файла.

**Опции**

* *String* **target** — Таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);
```

symlink
-------

Создает симлинк из одного таргета в другой. Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.

**Опции**

* *String* **fileTarget** — Исходный таргет. Обязательная опция.
* *String* **symlinkTarget** — Результирующий таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/symlink'), {
  fileTarget: '?.css',
  symlinkTarget: '_?.css'
} ]);
```
