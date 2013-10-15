## 工作流程


#### 1. 创建 repo 并获取到本地

建议先在 github 或者其他 git 托管服务器中创建项目，再 clone 到本地。

这样有助于在调用 `ctx init` 命令时，cortex 能够获取到尽可能详细的信息。

#### 2. 初始化 cortex


	ctx init [--force]
	
期间如果出现交互式的提问，可以根据自己的项目来进行设置。

`ctx init` 会创建 cortex 项目的[脚手架](http://en.wikipedia.org/wiki/Scaffold_\(programming\))，包含：

- 示例模块
- 项目的基本配置文件，如 package.json
- 测试模板

#### 3. 安装模块依赖

要使用一个外部模块，首先，需要安装该模块，以 `'lang'` 模块为例：

	ctx install lang --save
	
`--save` 参数，会将模块依赖写入 package.json。

上面例子中的默认情况，会安装 `'lang'` 的最新版本。

#### 4. 开发及提交代码

### Vision:测试版本


#### 5. 验证 package.json
	
	ctx validate

包括验证

- 当前开发版本是否没有在 npm server 上被占用
- 依赖的模块及版本是否存在

#### 6. 编译当前项目的代码

	ctx build

将类似使用 Node.js 方式编写的代码，进行包裹，让每个模块在浏览器环境下也能够在独立的 sandbox 中运行。

默认的，`ctx build` 命令会在编译成功后将当前项目发布到 cortex server 的目录。


### Vision:终极目标
希望测试版本中的工作，之后不需要手动进行。

- Cortex 安装完成后，会启动 cortex server，并且能够报错重启，开机自动启动
- 使用 `ctx init` 初始化的项目 或者 运行过 `ctx watch` 的项目，会加入 cortex 的监视列表，当这些项目被修改后，会自动编译并发布到本地的 cortex server
- 每当项目的 package.json 文件被修改后，会调用 `ctx validate` 方法向 npm server 验证。