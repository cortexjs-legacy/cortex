# 快速开始

## 环境准备

### 安装 Node.js

访问 [http://nodejs.org](http://nodejs.org) 下载合适的版本安装。

并针对不同的系统，设置好环境变量 `NODE_PATH`

### 安装 cortex

	npm install cortex -g

## 工作流程

### 1. 创建 repo 并获取到本地

建议先在 github 或者其他 git 托管服务器中创建项目，再 clone 到本地。

这样有助于在调用 `cortex init` 命令时，cortex 能够获取到尽可能详细的信息。

### 2. 初始化 cortex

	cortex init [--force]
	
期间如果出现交互式的提问，可以根据自己的项目来进行设置。

`cortex init` 会创建 cortex 项目的[脚手架](http://en.wikipedia.org/wiki/Scaffold_\(programming\))，包含：

- 示例模块
- 项目的基本配置文件，如 package.json
- 测试模板

### 3. 安装模块依赖

要使用一个外部模块，首先，需要安装该模块，以 `'lang'` 模块为例：

	cortex install lang --save
	
`--save` 参数，会将模块依赖写入 package.json。

上面例子中的默认情况，会安装 `'lang'` 的最新版本。

### 4. 开发及提交代码

这是你最热爱的事情，享受其中吧。

### 5. 编译当前项目的代码

大部分的时候，你可以使用 `cortex watch` 命令来监测项目的变化，当项目中有文件变化的时候，cortex 会自动调用 build 命令。

当然，你也可以手动运行 `cortex build` 命令，将类似使用 Node.js 方式编写的代码，进行包裹，让每个模块在浏览器环境下也能够在独立的 sandbox 中运行。

默认的，`cortex build` 命令会在编译成功后将当前项目发布到 cortex server 的目录。


### 6. 发布

- 确保已经把项目依赖的模块通过 `cortex publish` 将模块发布到公共源
- 在服务器上运行 `cortex install` 即可