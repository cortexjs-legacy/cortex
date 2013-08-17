# Option configurations

> The developers' draft

The [comfort](https://github.com/kaelzhang/comfort) option configurations. 


### exports.options `Object`

An object composed of `<key>: <configuration>`

See npm module, argv-parser for details

#### key `String`

`'cwd'` -> `'--cwd'`

#### configuration `Object`

- type: `mixed`
- short: `String` `'c'`: `'-c'` <=> `'--cwd'` 
- short_pattern: `Array` 
	- default to `['--<short>']`
	- `['--cwd', '/home' ]`: `'-c'` <=> `'--cwd /home'` 
- info: `String` will be displayed when `cortex help <command>`
- value: 
	- `function(v, parsed, tools)` the setter function
	- `other types` default value
	
##### v `mixed`

The value which have just parsed

##### parsed `Object`

The parsed arguments

##### tools.error(msg)

Report an error message, which will lead to a failure

##### tools.warn(msg)

Report a warning

### exports.info `String`

Will be printed as help info.

### exports.usage `String|Array.<String>`