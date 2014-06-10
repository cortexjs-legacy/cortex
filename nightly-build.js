'use strict';

var spawns = require('spawns');
var jf = require('jsonfile');

var pkg = jf.readFileSync('package.json');

function changeName (name, old) {
  pkg.name = name;
  pkg.bin[name] = pkg.bin[old];
  delete pkg.bin[old];
  jf.writeFileSync('package.json', pkg);
  console.log('name changed to', name);
}

process.on('exit', function () {
  changeName('cortex', 'cortex-canary');
});

changeName('cortex-canary', 'cortex');

spawns('npm publish', {
  cwd: __dirname,
  stdio: 'inherit'
}).on('spawn', function (command) {
  console.log(command);
}).on('close', function (code) {
  console.log('exit code', code);

}).on('error', function (err) {
  console.log('err', err);
});
