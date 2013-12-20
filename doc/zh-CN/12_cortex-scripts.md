# cortex scripts

说明 cortex 是怎样处理 package.json 中的 "scripts" 属性的。

## 定义

所有的 "scripts" 都为可选，即可以不定义。

- prebuild：当 cortex 项目被 "编译"（包裹，处理入口等操作）之前执行的脚本。
- prepublish：在当前项目打包为 tarball 之前运行，该脚本执行成功后，则会提交到 registry 服务器。如果 `scripts.prepublish` 没有定义，cortex 会尝试使用 `scripts.prebuild` 代替。如果要强制不运行 "prepublish" 脚本，可以为该参数设置为 **空字符串** 或 **空数组**
- preinstall：当某一个 package 的 tarball 下载并解压后运行，该脚本执行成功之后，cortex 会尝试去递归安装当前 package 的依赖（假若有）。

### 特别说明

**定义 "preinstall" 是非常不好的实践方式，不到万不得已，尽量避免使用。**

### 典型使用场景

假若，我们有一个项目：

1. 包含多个 JavaScript 文件，但是这些文件无法单独运行，必须 concat 到一起才能形成完整的语法
2. concat 是交给 grunt tasks 来做的，对应的命令就是 `grunt`

那么我们可以这样来配置 "scripts" 这个 field.

```
{
	"scripts": {
		"prebuild": "grunt"
	}
}
```

**它等价于**（请注意 JSON 文件中不能直接写注释，下面仅仅是用于提示）

```
{
	"scripts": {
		// 每一个具体的 script 可以是字符串，若是多条命令，则可以写成数组
		"prebuild": [
			"grunt"
		],
		
		// 若 "prepublish" 没有定义，默认会与 "prebuild" 相同，为什么？可以继续看设计原则慢慢体会
		"prepublish": "grunt",
		// 若某一个 script 为空字符串，则不会被执行。
		"preinstall": ""
	}
}
```


## 设计原则

1. 在依赖被安装的过程中，尽最大可能，不需要借助 cortex 之外的任何工具，包括 `grunt`，`rake`，`make` 等。
2. 为了完成第一点，我们希望尽量将已经预处理好的内容 publish 到 registry 中。
3. 在开发阶段，监听文件改变仅需要使用 `cortex watch`，而能够替代 `grunt watch` 等监听器。
4. 对于特殊情况仍然能够提供一定支持。
5. 能够提供较好的持续集成的配置方案。

### 为什么不推荐使用 preinstall ?

cortex 之所以这样设计，是为了避免其他语言与之类似的问题。

大家有可能使用过一些其他语言的包管理器，一个很坏的情况，就是可能今天下午我们都在处理各种安装失败的问题，因为每安装到一个阶段，就会提示有一个第三方库没有安装，甚至报错提示中根本不会告诉你是由于缺失某个其他的库而引起的。

比如，（突然想不到例子了，大家帮忙补充一下）

我们希望 cortex 生态环境中的 **package 本身是内聚的**，即这个 package 一旦发布到 registry 中，它便不需要依赖除 cortex 之外的任何内容。

我们不希望在用户运行 `cortex install jquery` 提示你 `grunt` 命令不存在。

更好的做法是，需要依赖 `grunt` 做的事情，在发布到 registry 之前便已经做完。

#### 小知识点

有三种依赖，显式的依赖，插件式的依赖，隐式的依赖。

##### 显式依赖

模块中明确声明了需要依赖的模块包括它的版本（或者是最新版）。

我们在进行系统的设计时，**尽可能使用这种方式**。

##### 插件式的依赖

模块 A 并没有声明依赖 B，但是 A 自己无法直接运行，而是交给 B 来运行 A。这个时候，其实上产生了一种依赖关系，而且实际上，对于一个具体的 A，可能只有某个或者某几个具体版本的 B 才能跑得起来。

##### 隐式依赖

模块 A 中并没有声明需要依赖 B，但是 A 的运行，依赖于 B 运行的结果。比如 node.js 中的 `require('child_process').spawn`。这种情况常发生在跨语言调用的情景之下。

这也是非常多包管理器或者生态环境不好用的原因所在。

## 执行流程

（图，稍后补充）

### 安装一个依赖

download tarball

scripts.preinstall

install dependencies

build

deploy to local server

### 开发当前项目

clone repo

[npm install]

cortex watch (or cortex build)

scripts.prebuild

deploy to local server

### 发布

scripts.prepublish

publish to registry