/**
 * level-plain
 * ===========
 *
 * Схема именования для уровней переопределения.
 */
var FileList = require('../file-list');
var Vow = require('vow');
var fs = require('fs');

module.exports = {

    buildLevel: function (levelPath, levelBuilder) {
        return Vow.when(addPlainFiles(levelPath, levelBuilder)).then(function () {
            levelBuilder.build();
        });
    },

    buildFilePath: function (levelPath, blockName, elemName, modName, modVal) {
        return levelPath + '/' + blockName +
            (elemName ? '__' + elemName : '') +
            (modName ? '_' + modName : '') +
            (modVal ? '_' + modVal : '');
    }

};

function addPlainFiles(directory, levelBuilder) {
    filterFiles(fs.readdirSync(directory)).forEach(function (filename) {
        var fullname = directory + '/' + filename;
        var stat = fs.statSync(fullname);
        var bem;
        if (stat.isDirectory()) {
            if (filename.indexOf('.') !== -1) {
                bem = FileList.parseFilename(filename).bem;
                levelBuilder.addFile(fullname, bem.block, bem.elem, bem.modName, bem.modVal);
            } else {
                addPlainFiles(fullname, levelBuilder);
            }
        } else {
            bem = FileList.parseFilename(filename).bem;
            levelBuilder.addFile(fullname, bem.block, bem.elem, bem.modName, bem.modVal);
        }
    });
}

function filterFiles(filenames) {
    return filenames.filter(function (filename) {
        return filename.charAt(0) !== '.';
    });
}
