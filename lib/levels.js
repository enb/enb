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

    getBlockFiles: function(blockName, modName, modVal) {
        var block, files, res = [],
            blocks = this.getBlocks(blockName);
        for (var i = 0, l = blocks.length; i < l; i++) {
            block = blocks[i];
            if (modName) {
                if (block.mods[modName] && block.mods[modName][modVal]) {
                    files = block.mods[modName][modVal];
                } else {
                    files = [];
                }
            } else {
                files = block.files;
            }
            res = res.concat(files);
        }
        return res;
    },

    getElemFiles: function(blockName, elemName, modName, modVal) {
        var elem, files, res = [],
            elements = this.getElems(blockName, elemName);
        for (var i = 0, l = elements.length; i < l; i++) {
            elem = elements[i];
            if (modName) {
                if (!(elem.mods[modName] && (files = elem.mods[modName][modVal]))) {
                    files = [];
                }
            } else {
                files = elem.files;
            }
            res = res.concat(files);
        }
        return res;
    }
};

module.exports = Levels;
