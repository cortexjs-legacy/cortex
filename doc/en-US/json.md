# package.json

Specifics of cortex's package.json handling.

## Cortex Properties

All sections below are under the namespace of "cortex" in package.json.

### cortex.main

type `Path`

The main field is the pathname of the primary entry point to your commonjs package.

If your package is named `foo` and have been installed, then `require('foo')` return your main module's exports object.

### cortex.ignores

type `Array.<Path>` default to

	[
		'.git',
        '.svn',
        '.DS_Store'
	]	

The ignore rules that tell cortex which files should be ignored and be excluded from the tarball.

"ignores" could also contains negative rules.


### cortex.directories

The [CommonJS Packages](http://wiki.commonjs.org/wiki/Packages/1.0) standard specifies a few ways that you can indicate the structure of your package using a `directories` hash.

But for web development, we take the modules for a different usage, so we define a "directories" property under the `cortex` hash to do the similar thing.

#### directories.lib

default to `"lib"`

No use by now.

#### directories.style

default to `"css"`

If you specify a "style" directory, then all the files in that folder will be saved as `cortex.styles` when publishing.

#### directories.template

default to `"template"`

These will be treated in some proper way, someday.

### cortex.dependencies

type `Array.<String>`

Similar to `dependencies`, `cortex.dependeices` defines the dependencies of web modules.

