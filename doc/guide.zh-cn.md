# Cortex 开发者使用指南


## 简介

Cortex **不是**一个任务构建工具，**不是**一个版本管理工具；

而是一个针对浏览器端开发的前端环境和模块管理器，特别为基于 [CommonJS](http://wiki.commonjs.org) 开发的前端项目而设计。它提供：

- 基于 [CommonJS:Modules/1.0](http://wiki.commonjs.org/wiki/Modules/1.0) 的 wrapping 服务，可以 **让开发者完全使用 Node.js 的方式来开发 web 应用 **
- 提供 Web 开发的模块管理器
- 提供针对 Web 页面的发布方案


## 环境准备

### 安装 Node.js

访问 [http://nodejs.org](http://nodejs.org) 下载合适的版本安装。

并针对不同的系统，设置好环境变量 `NODE_PATH`

### 安装 cortex

目前测试版本中，暂时没有发布到 npm。可以使用如下代码手动安装：

	git clone git@github.com:kaelzhang/cortex.git
	cd cortex
	
	# Linux 或 Mac 可能需要使用 `sudo`
	npm link
	
	# 目前仅支持 Linux 和 Mac OSX
	bash install.sh
	
上面的命令执行成功后，terminal 中会增加一个 `ctx` 命令。

## 工作流程


#### 1. 创建 repo 并获取到本地

建议先在 github 或者其他 git 托管服务器中创建项目，再 clone 到本地。

#### 2. 初始化 cortex


	ctx init [--force]
	
期间如果出现交互式的提问，可以根据自己的项目来进行设置。

`ctx init` 会创建 cortex 项目的[脚手架](http://en.wikipedia.org/wiki/Scaffold_\(programming\))，包含：

- 示例模块
- 项目的基本配置文件，如 package.json
- 测试模板

#### 3. 安装模块依赖

首先，需要安装该模块，以 `'lang'` 模块为例

	ctx install lang --save
	
`--save` 参数，会将模块依赖写入 package.json。

上面例子中的默认情况，会安装 `'lang'` 的最新版本。

#### 4. 开发及提交代码

### Vision:测试版本


#### 5. 验证 package.json

包括验证

- 当前开发版本是否没有在 npm server 上被占用
- 依赖的模块及版本是否存在

#### 6. 编译当前项目的代码

	ctx build

将类似使用 Node.js 方式编写的代码，进行包裹，使每个模块在浏览器环境下，也能够在独立的 sandbox 中运行。
默认的，`ctx build` 命令会在编译成功后将当前项目发布到 cortex server 的目录。


### Vision:终极目标
- cortex 安装完成后，会启动 cortex server，并且能够报错重启，开机自动启动
- 使用 `ctx init` 初始化的项目 或者 运行过 `ctx watch` 的项目，会加入 cortex 的监视列表，当这些项目被修改后，会自动编译并发布到本地的 cortex server
- 每当项目的 package.json 文件被修改后，会调用 `ctx validate` 方法向 npm server 验证。


