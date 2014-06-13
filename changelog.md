# Change Log

## 4.x

4.x contains several important refactors, including:

<!-- - 4.1.0: Removes `config.server_mode`, and uses `fs.link` to the server root. -->
- 4.2.0: #372, Better cortex update.
- 4.1.0: #362, `cortex.css` supports glob.
- 4.0.0: #351, Redesigns, removes `directories.css`, `directories.template`. Supports package with only css files.

## 3.x

- 3.29.0: `cortex install --save` and `cortex update` will also update cortex-shrinkwrap.json(if exists).
- 3.28.0: #344, #342: Migrate cortex plugin shrinkwrap as a builtin command.
- 3.27.0: #341: Support package.engines.
- 3.26.0: #338, 339: Support install from cortex-shrinkwrap.json; Support more directories.
- 3.25.0: #325, Better support for plugins. Eliminates all synchronous invocations of fs.
- 3.24.0: #284, #285, Builder and initializer are now built-in modules.
- 3.23.2: #304, Improves all logics about async by using `async.eachSeries` and `async.each`.
- 3.23.1: #303, Removes all sync fs.
- 3.23.0: #297, Ignores empty folders and `node_modules` directory by default when publishing. Fixes the bug that directories could not be ignored.
- 3.22.1: Redesigns cortex config command and bug fixes.
- 3.19.0: Redesigns path calculation to make sure it won't be wrong.


## Former

Oh, the changes are too old to track :p

