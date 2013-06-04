# Cortex 命令

	ctx

即可看到基本的帮助。

## 基本命令
#### ctx --help 
查看 ctx 帮助

#### ctx \<command\> [options]
执行一个 ctx 命令，比如执行 `init` 命令
	
	ctx init
	
#### ctx help \<command\> 或 ctx \<command\> --help
查看某一个 ctx 命令的详细帮助
	
	ctx init --help
	ctx help init


## Cortex 开发方式介绍

### 启动本地静态服务器
	
	ctx server

更多参数参见 `ctx server --help`

初始的时候，cortex server 中不包含任何内容，只有执行过 `ctx install` 或当在项目中执行了 `ctx build` 之后，cortex server 中才包含这些特定模块的 



#### package.json

"package.json" 是 cortex 项目中，一个比较重要的文件，它相当于 maven 的 pom.xml 文件。用于标记当前项目的基本信息，主要包含：

- name: `String` 当前项目的名字，即模块的 id
- version: `String` 当前项目的版本号，遵循 [semantic versioning](http://semver.org) 规范
- main: `String` 当前项目的入口文件，详见 \<入口文件\>
- cortexDependencies: `JSON` 定义当前项目依赖的 web 模块

该文件中的大部分值，一般都不需要手动进行修改，并且在项目创建的时候， `ctx init` 会完成大部分的初始值设置。