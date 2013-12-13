# 安装与配置

## 安装

安装 cortex 之前，需要在本地环境中安装 [node.js](http://nodejs.org/)，具体的安装方法这里不累述。

	npm install cortex -g

## 配置

大部分的时候，不需要任何额外的配置，就可以使用 cortex 绝大部分的功能。

在某些场景下，可能需要进行部分的配置。

### 场景：使用自建的 registry（模块仓库）

在命令行中运行：

	cortex config registry

可能会出现如下提示，并根据交互输入有效的新 registry 地址（URL）即可

    [?] value: (http://registry.cortexjs.org/)


### 场景：提交模块到远程仓库

提交模块到远程仓库之前，你需要在命令行中完成添加用户信息的操作：

    cortex adduser

然后根据交互提示进行下面的操作，具体可参见 `cortex adduser` 命令。


### 其他的配置

可以使用如下的命令来设置其他大部分的配置

	cortex config <config-key>
	
其中，`config-key` 的取值可包含：

#### workspace

类型：`path`

当使用 `cortex install <package> --clone` 之后，项目 repo 会被下载到的目录。

#### colors

类型：`Boolean`，默认为 `true`
	
定义 cortex 各种命令的命令行输出是否包含颜色（即是否包含 [SGR](http://en.wikipedia.org/wiki/ANSI_escape_code) ），在某些不支持颜色的 CI 系统中，将 `colors` 设置为 `false` 会比较有用。

#### init_template

类型：`String`，默认为 `cortex`

指定 cortex init 命令使用的 grunt-init task 的名称。


#### service_port

类型：`Number`，默认为 `9074`

指定 cortex server 的端口号。

	


