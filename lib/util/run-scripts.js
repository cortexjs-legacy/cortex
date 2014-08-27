'use strict';

module.exports = run_scripts;

var spawns = require('spawns');
var mix = require('mix2');
var neuron = require('neuronjs');
var node_path = require('path');

function run_scripts (scripts, options) {
  return spawns(scripts, {
    cwd: options.cwd,
    stdio: 'inherit',
    env: get_script_env(options)
  });
};


function get_script_env (options) {
  var env = options.env;
  if (Object(env) === env) {
    return env;
  }

  env = mix({}, process.env);

  // Others may expect the NEURON_VERSION value
  env.NEURON_VERSION = neuron.version();
  var bin = node_path.join(options.cwd, 'node_modules', '.bin');
  // Adds the /.bin dir to ENV, so that people can set `cortex.scripts.prebuild`
  // as `gulp` instead of `./node_modules/.bin/gulp`
  env.PATH = env.PATH
    ? bin + ':' + env.PATH
    : bin;

  if (options.prerelease) {
    env.CORTEX_BUILD_PRERELEASE = options.prerelease;
  }

  return options.env = env;
};
