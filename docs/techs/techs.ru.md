# Технологии для работы с файлами

Все технологии, включенные в пакет ENB, находятся в папке `techs` пакета. Подключаются из [make-файла](../terms/terms.ru.md) с помощью `require('enb/techs/<tech-name>')`.

Например:

`require('enb/techs/js')`

Чтобы подключить технологию к [ноде](../terms/terms.ru.md), укажите класс и опции (необязательно):

`nodeConfig.addTech([ require('enb/techs/<tech-name>'), {/* [options] */} ]);`

Без опций:

`nodeConfig.addTech(require('enb/techs/<tech-name>'));`

Чтобы создать копии технологий для каждого языка, который установлен для ноды или проекта (если у ноды не указаны языки), укажите подстроку `{lang}` в опциях при настройке технологии.

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

## Технологии

* [file-copy](#file-copy)
* [file-merge](#file-merge)
* [file-provider](#file-provider)
* [symlink](#symlink)
* [write-file](#write-file)

### file-copy

Копирует один таргет в другой.
Может, например, использоваться для построения `_?.css` из `?.css` для development-режима.

**Опции**

* *String* **source** — Исходный таргет. Обязательная опция.
* *String* **sourceNode** — Путь ноды с исходным таргетом.
* *String* **target** — Результирующий таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-copy'), {
  source: '?.css',
  target: '_?.css'
} ]);
```

### file-merge

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

### file-provider

Предоставляет существующий файл для make-платформы.
Может, например, использоваться для предоставления исходного *bemdecl*-файла.

**Опции**

* *String* **target** — Таргет. Обязательная опция.

**Пример**

```javascript
nodeConfig.addTech([ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ]);
```

### symlink

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

### write-file

 Записывает целевой файл в файловую систему.

 **Опции**

* *String* **target** — имя генерируемого файла. Обязательная опция.
* *String | Buffer* **content** - контент генерируемого файла, если он есть файл будет сгенерирован
* *Object | String* **fileOptions** - [аттрибуты генерируемого файла]{@link https://goo.gl/ZZzrdr} (default: 'utf8')

**Пример**

Генерируем текстовый-файл

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

Генерируем `bemdecl`-файл

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
