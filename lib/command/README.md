# Cortex Commanders

> The developers' draft

All modules should include a `run` method as an export.


## Special command: cortex server

If started a server at port 9074, we could call cortex command by http GET request:

	/_action/:command?:options
	
For example, you wanna install `jquery` to project `align`, you could request 

	http://localhost:9074/_action/install?cwd=/where/you/put/align/to&save=true&modules=jquery
	
For detail options of each command, see `lib/option/<command>.js`.


## cortex publish

### Premise

**pre-release versions will NEVER go public, or it will be an another story.**

### Allow

new          | already in registry | reason
------------ | ------------------- | -------
1.2.3        | 1.2.1, 1.2.2        | the neweast version
1.2.3        | 1.2.1, 1.3.4        | the neweast version of the current feature
1.2.4-alpha  | 1.2.2               | any prerelease versions

### Forbidden

new          | already in registry | reason
------------ | ------------------- | -------
1.2.3-alpha  | 1.2.3               | 1.2.3 is newer
1.2.3        | 1.2.4               | 1.2.4 is newer
1.2.3-alpha  | 1.2.4               | 1.2.4 is newer