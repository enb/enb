var fs = require('fs'),
    vm = require('vm');

var testText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tristique sagittis lacus, nec tincidunt odio molestie sed. Nam commodo, massa eu viverra accumsan, sem lacus porttitor est, vel vehicula purus orci nec arcu. Sed gravida nulla ut urna porttitor venenatis. Nullam tincidunt tempus laoreet. Sed nec mi sit amet leo cursus suscipit. Quisque vel libero quis elit porttitor facilisis. Mauris blandit, mi et placerat aliquet, turpis nisl auctor nisl, eu cursus risus lacus id purus. Nulla dolor metus, fringilla porttitor aliquam eget, viverra a neque. Pellentesque magna risus, hendrerit eu suscipit eget, malesuada ac orci. Morbi ac justo magna. ' +
    'Donec ut nisi enim, et facilisis dolor. Nullam congue tortor eget tortor ultricies ut vulputate nulla pharetra. Nullam a sagittis ante. Mauris sed elit eget orci hendrerit iaculis euismod sit amet libero. Mauris sollicitudin varius orci non gravida. Curabitur lectus sapien, scelerisque a gravida sit amet, facilisis non enim. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vitae sem lacus, vitae volutpat diam. Sed eu felis sed nulla imperdiet lacinia eget vel magna. Nullam purus mi, tempus quis fringilla vitae, imperdiet a ligula. ' +
    'Integer rhoncus consequat interdum. Donec molestie mi feugiat odio dapibus volutpat. Proin scelerisque, nunc id euismod vehicula, lectus est euismod justo, vitae scelerisque augue dolor eu mi. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vestibulum bibendum, ante ac dictum ultricies, elit sapien varius est, vel blandit sapien ipsum ac lacus. Vivamus luctus posuere ornare. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et posuere risus. ' +
    'Integer tellus eros, suscipit et aliquam nec, aliquet at sapien. Fusce auctor gravida ligula, vel elementum sapien vestibulum in. Suspendisse eu convallis ante. Etiam tempor vulputate malesuada. Vestibulum semper nisl vel lacus pulvinar sollicitudin dictum dolor vulputate. Ut est lacus, euismod quis semper eu, laoreet ac enim. Etiam eu justo erat, ut elementum nisl. Nam commodo, sapien eget tristique condimentum, lacus eros imperdiet mauris, sed mollis dui lectus congue magna. Sed purus sem, pharetra in iaculis vitae, aliquam a est. Sed a dolor diam, ut elementum arcu. Duis egestas justo quis dolor rutrum vulputate. Etiam volutpat dictum arcu lobortis gravida. Phasellus mollis nisl a tortor porta sodales. Morbi at sagittis quam. Vivamus ac nibh at ipsum vestibulum hendrerit. Suspendisse potenti. ' +
    'Sed iaculis mattis dui, vitae scelerisque nibh accumsan at. Aliquam erat volutpat. Suspendisse tincidunt leo sit amet est consequat hendrerit. Proin a nulla eget lacus posuere pharetra. Nunc non leo augue, non laoreet diam. Aenean libero leo, accumsan quis tristique in, cursus vel erat. Fusce ipsum lorem, viverra non iaculis eget, scelerisque at velit. Curabitur vitae ipsum non sem viverra volutpat. Suspendisse mi nunc, pellentesque blandit vulputate non, aliquet non ligula. Etiam risus nunc, pharetra quis consequat in, tincidunt et nunc. Sed at tempus magna.';

var testTextObj = {
    val: testText
};

var longArray = [];
for (var i = 0, l = 100; i < l; i++) {
    longArray.push(testTextObj);
}

function benchmark(name, tests) {
    var c = 1000;
    console.log(name + ' ' + c + ' times.');
    Object.keys(tests).forEach(function(testName) {
      var cb = tests[testName];
      var i = 0;
      var start = new Date();
      while (i < c) {
        cb();
        i++;
      }
      var time = (new Date()) - start;
      console.log('    ' + testName + ': ' + time + 'ms, ' + (Math.round(c/time)) + 'op/msec');
    });
    console.log('');
}

var filename = '/tmp/__json-vs-text.tmp';

benchmark('File writes', {
    'string write': function() {
        fs.writeFileSync(filename, testText, 'utf8');
    },
    'JSON string write': function() {
        fs.writeFileSync(filename, JSON.stringify(testText), 'utf8');
    },
    'object write': function() {
        fs.writeFileSync(filename, '{"val": "' + testText + '"}', 'utf8');
    },
    'JSON object write': function() {
        fs.writeFileSync(filename, JSON.stringify(testTextObj), 'utf8');
    },
    'JSON long array write': function() {
        fs.writeFileSync(filename, JSON.stringify(longArray), 'utf8');
    },
    'long array manual write': function() {
        var res = [];
        for (var i = 0, l = longArray.length; i < l; i++) {
            res.push('{"val": "' + longArray[i].val + '"}'); // No string escaping and still slower.
        }
        fs.writeFileSync(filename, '[' + res.join(',') + ']', 'utf8');
    },
    'long array read': function() {
        fs.readFileSync(filename, 'utf8');
    },
    'long array read and vm.runInThisContext': function() {
        vm.runInThisContext(fs.readFileSync(filename, 'utf8'));
    },
    'long array read and JSON.parse': function() {
        JSON.parse(fs.readFileSync(filename, 'utf8'));
    }
});