# Change Log

## 5.x

- **5.3.0**: 
  - [#429][429]: Completely support [File Modules](http://nodejs.org/api/modules.html#modules_file_modules), `require()` directories, `__dirname` and `__filename`.
  - [#430][430]: Cortex build will transform filenames to lowercased paths.
- **5.2.0**: A new command `cortex ls` to print the dependency tree.
- **5.1.0**: [#386][386]: Supports packages with entries but no main entry, but this kind of packages could not be published.
- **5.0.0**: [#396][396]: 
  - Full support for [semver ranges](https://github.com/mojombo/semver/issues/113). 
  - Completely refactors module management and package management.

## 4.x

4.x contains several important refactors, including:

- **4.5.0**: [#393][393]: Supports ranges like `^0.1.0` and validates ranges.
- **4.4.0**: [#388][388]: Improves the performance of cortex build by using `fs.symlink` to create ranges.
- **4.3.0**
  - [#381][381]: Removes `config.server_mode`; 
  - [#281][281]: Creates a symbolic link from "neurons" to `built_root`.
- **4.2.0**: [#372][372]: Better cortex update. 
  No longer publish package.json by default.
- **4.1.0**: [#362][362]: `cortex.css` supports glob.
- **4.0.0**: 
  - [#351][351]: Redesigns, removes `directories.css`, `directories.template`. 
  - Supports package with only css files.

## 3.x

- **3.29.0**: `cortex install --save` and `cortex update` will also update cortex-shrinkwrap.json(if exists).
- **3.28.0**: [#344][344] [#342][342]: Migrate cortex plugin shrinkwrap as a builtin command.
- **3.27.0**: [#341][341]: Support package.engines.
- **3.26.0**: [#338][338], [#339][339]: Support install from cortex-shrinkwrap.json; Support more directories.
- **3.25.0**: [#325][325]: Better support for plugins. Eliminates all synchronous invocations of fs.
- **3.24.0**: [#284][284], [#285][285]: Builder and initializer are now built-in modules.
- **3.23.2**: [#304][304]: Improves all logics about async by using `async.eachSeries` and `async.each`.
- **3.23.1**: [#303][303]: Removes all sync fs.
- **3.23.0**: [#297][297]: Ignores empty folders and `node_modules` directory by default when publishing. Fixes the bug that directories could not be ignored.
- **3.22.1**: Redesigns cortex config command and bug fixes.
- **3.19.0**: Redesigns path calculation to make sure it won't be wrong.


## Former

Oh, the changes are too old to track :p

[396]: https://github.com/cortexjs/cortex/issues/396
[393]: https://github.com/cortexjs/cortex/issues/393
[388]: https://github.com/cortexjs/cortex/issues/388
[381]: https://github.com/cortexjs/cortex/issues/381
[281]: https://github.com/cortexjs/cortex/issues/281
[372]: https://github.com/cortexjs/cortex/issues/372
[362]: https://github.com/cortexjs/cortex/issues/362
[351]: https://github.com/cortexjs/cortex/issues/351
[344]: https://github.com/cortexjs/cortex/issues/344
[342]: https://github.com/cortexjs/cortex/issues/342
[341]: https://github.com/cortexjs/cortex/issues/341
[338]: https://github.com/cortexjs/cortex/issues/338
[339]: https://github.com/cortexjs/cortex/issues/339
[325]: https://github.com/cortexjs/cortex/issues/325
[284]: https://github.com/cortexjs/cortex/issues/284
[304]: https://github.com/cortexjs/cortex/issues/304
[303]: https://github.com/cortexjs/cortex/issues/303
[297]: https://github.com/cortexjs/cortex/issues/297

