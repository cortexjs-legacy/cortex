# Cortex Commanders

> The developers' draft

All modules should include a `run` method as an export.


## Special command: cortex server

If started a server at port 9074, we could call cortex command by http GET request:

	/_action/:command?:options
	
For example, you wanna install `jquery` to project `align`, you could request 

	http://localhost:9074/_action/install?cwd=/where/you/put/align/to&save=true&modules=jquery
	
For detail options of each command, see `lib/option/<command>.js`.