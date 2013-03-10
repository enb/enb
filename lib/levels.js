function Levels(items) {
    this.items = items;
}

Levels.prototype = {
    getBlocks: function(blockName) {
        var block, blocks = [];
        for (var i = 0, l = this.items.length; i < l; i++) {
            block = this.items[i].blocks[blockName];
            if (block) {
                blocks.push(block);
            }
        }
        return blocks;
    },

    getElems: function(blockName, elemName) {
        var block, elements = [];
        for (var i = 0, l = this.items.length; i < l; i++) {
            block = this.items[i].blocks[blockName];
            if (block && block.elements[elemName]) {
                elements.push(block.elements[elemName]);
            }
        }
        return elements;
    },

    getBlockEntities: function(blockName, modName, modVal) {
        var block, files = [], dirs = [], res = [],
            blocks = this.getBlocks(blockName);
        for (var i = 0, l = blocks.length; i < l; i++) {
            block = blocks[i];
            if (modName) {
                if (block.mods[modName] && block.mods[modName][modVal]) {
                    files = files.concat(block.mods[modName][modVal].files);
                    dirs = dirs.concat(block.mods[modName][modVal].dirs);
                }
            } else {
                files = files.concat(block.files);
                dirs = dirs.concat(block.dirs);
            }
        }
        return {files: files, dirs: dirs};
    },


    getElemEntities: function(blockName, elemName, modName, modVal) {
        var elem, files = [], dirs = [], res = [],
            elems = this.getElems(blockName, elemName);
        for (var i = 0, l = elems.length; i < l; i++) {
            elem = elems[i];
            if (modName) {
                if (elem.mods[modName] && elem.mods[modName][modVal]) {
                    files = files.concat(elem.mods[modName][modVal].files);
                    dirs = dirs.concat(elem.mods[modName][modVal].dirs);
                }
            } else {
                files = files.concat(elem.files);
                dirs = dirs.concat(elem.dirs);
            }
        }
        return {files: files, dirs: dirs};
    },

    getBlockFiles: function(blockName, modName, modVal) {
        return this.getBlockEntities(blockName, modName, modVal).files;
    },

    getElemFiles: function(blockName, elemName, modName, modVal) {
        return this.getElemEntities(blockName, elemName, modName, modVal).files;
    }
};

module.exports = Levels;
