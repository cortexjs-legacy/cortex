#!/usr/bin/env node

'use strict';

// Nodejs libs.
var node_path = require('path');

// External libs.
var hooker = require('hooker');

// This has to be loaded before the "prompt" dep loads it, or colors won't
// get disabled with --no-color correctly.
require('colors');

// Get the path to an asset, relative to this module's root directory.
var asset = node_path.resolve.bind(null, __dirname, '..', 'lib', 'grunt-init');

// Project metadata.
// var pkg = require(asset('package.json'));

// Grunt.
var grunt = require('grunt');
var helpers = require(asset('lib/helpers')).init(grunt);

// Hook into grunt.task.init to load the built-in init task.
hooker.hook(grunt.task, 'init', function() {
  console.log(node_path.resolve(__dirname, '..', 'lib', 'grunt-init'))
  grunt.task.loadTasks( node_path.resolve(__dirname, '..', 'lib', 'grunt-init') );
});

var name;
if (grunt.cli.tasks.length === 0) {
  // No task was specified on the command line, so run the init task
  // without any arguments.
  grunt.cli.tasks = ['init'];
} else {
  name = grunt.cli.tasks[0];
  // For the specified "task" prepend "init:" so the init task doesn't
  // actually need to be specified on the command line.
  grunt.cli.tasks = ['init:' + name];
}

// Remove grunt options that don't really make any sense for grunt-init.
[
  'base',
  'tasks',
  'gruntfile',
  'completion',
  'npm',
].forEach(function(option) {
  delete grunt.cli.optlist[option];
});

// Help methods to run, in-order.
grunt.help.queue = [
  'initOptions',
  'initTemplates',
  'initWidths',
  'header',
  'usage',
  'options',
  'templates',
  'footer',
];

// Header
grunt.help.header = function() {
  // grunt.log.writeln('grunt-init: Generate project scaffolding from a template. (v' + pkg.version + ')');
};

// Usage info.
grunt.help.usage = function() {
  grunt.log.header('Usage');
  grunt.log.writeln(' ' + node_path.basename(process.argv[1]) + ' [options] [template]');
};

// Template listing.
var templates;
grunt.help.initTemplates = function() {
  // Initialize task system so that the templates can be listed.
  grunt.task.init([], {help: true});
  // Initialize searchDirs so template assets can be found.
  helpers.initSearchDirs(name);
  // Valid init templates (.js or .coffee files).
  var templatesMap = helpers.getTemplates();
  templates = Object.keys(templatesMap).map(function(name) {
    var description = templatesMap[name].description;
    grunt.help.initCol1(name);
    return [name, description || '(no description)'];
  });
};

grunt.help.templates = function() {
  grunt.log.header('Available templates');
  if (templates.length > 0) {
    grunt.help.table(templates);
  } else {
    grunt.log.writeln().writeln('(No templates found)');
  }
  grunt.log.writeln().writelns(
    'Templates that exist in the ' + helpers.userDir() + ' ' +
    'directory may be run with "grunt-init TEMPLATE". Templates that exist ' +
    'in another location may be run with "grunt-init /path/to/TEMPLATE". A ' +
    'template is a directory that must contain, at the very minimum, a ' +
    'template.js file.'
  );
};

grunt.help.footer = function() {
  grunt.log.writeln().writeln('For more information, see http://gruntjs.com/project-scaffolding');
};

// Display version number if asked.
if (grunt.cli.options.version) {
  // console.log('grunt-init v' + pkg.version);
}

// Start grunt.
grunt.cli();
