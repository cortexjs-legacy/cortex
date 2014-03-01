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
2. 为了完成第一点，我们希望尽量将已经预处理好的内容 publish 到 registry 中，。
3. 在开发阶段，监听文件改变仅需要使用 `cortex watch`，而能够替代 `grunt watch` 等监听器。
4. 对于特殊情况仍然能够提供一定支持。
5. 能够提供较好的持续集成的配置方案。

### 为什么不推荐使用 preinstall ?

cortex 之所以这样设计，是为了避免其他语言与之类似的问题。

大家有可能使用过一些其他语言的包管理器，一个很坏的情况，就是可能今天下午我们都在处理各种安装失败的问题，因为每安装到一个阶段，就会提示有一个第三方库没有安装，甚至报错提示中根本不会告诉你是由于缺失某个其他的库而引起的。

比如，[maximum-awesome](https://github.com/square/maximum-awesome) 这个项目，它是 Square 技术团队在 github 上开源的一套非常流行的 Vim 配置，他们的配置非常棒，但是安装的时候，有点小小的痛苦。当我看到看到 install 的方法是简单的一句 `rake`，我心里就想，rake 啊！我不讨厌 ruby，但是 rake。。我感觉大事不好。果不其然，我执行后报错了，告诉我缺失另外一个项目，我将缺失项安装了。但这个过程，就这样循环往复了好几个小时。而且由于中国特殊的国庆，中间还遇到某些资源被墙。

当有一天，你项目中用到的各种 package，都是跟上面的例子中一样的时候，那会是非常恼火的。而且更重要的是，我们很难几句话写出能够让机器能够自动执行的安装脚本来。

我们希望 cortex 生态环境中的 **package 本身是内聚的**，即这个 package 一旦发布到 registry 中，它便不需要依赖除 cortex 之外的任何内容。在安装任何模块的时候，我们不希望还需要人工来纠正其中的某些缺失项。

我们不希望在用户运行 `cortex install jquery` 提示你 `grunt` 命令不存在。

更好的做法是，需要依赖 `grunt` 做的事情，在发布到 registry 之前便已经做完，也就是说 `cortex install` 下载的内容，是开发者在自己的电脑中经过 grunt 处理之后的代码。

### 我们来看看三种依赖

有三种依赖，显式的依赖，插件式的依赖，隐式的依赖。

##### 显式依赖

模块中明确声明了需要依赖的模块包括它的版本（或者是最新版）。

我们在进行系统的设计时，**尽可能使用这种方式**。

##### 插件式的依赖

模块 A 并没有声明依赖 B，但是 A 自己无法直接运行，而是交给 B 来运行 A。这个时候，其实上产生了一种依赖关系，而且实际上，对于一个具体的 A，可能只有某个或者某几个具体版本的 B 才能跑得起来。

一个很典型的插件式的依赖就是 [grunt-tasks](http://gruntjs.com/plugins)（即 grunt plugins）。当你去写一个 grunt task 的时候，你并不需要显示依赖于 grunt，我们会这样写代码。

```js
module.exports = function(grunt){
	grunt.registerMultiTask(...)
	...
};
```

然而代码中的 `grunt` 从哪里来的呢？是 grunt 在调用这个 task 的时候传递进来的。

但是，这里带来一个问题，上面的 grunt task 没有定义它需要依赖的 grunt 的版本。Grunt 也会升级，如果有一天 grunt 的新版本不再支持老的用法如何是好呢，这个问题非常的麻烦，世界也许就会在这个时候崩坏。

Node.js blog 的一篇文章详细描述了这个问题：[Peer Dependencies](http://blog.nodejs.org/2013/02/07/peer-dependencies/)。

##### 隐式依赖

模块 A 中并没有声明需要依赖 B，但是 A 的运行，依赖于 B 运行的结果。比如 node.js 中的 `require('child_process').spawn`。这种情况常发生在跨语言调用的情景之下。

当我们安装 A 的时候，我们无法明确的知道 A 需要依赖 B，很多时候，我们是需要通过第一次运行 A，发生报错之后，我们才能知道 B 还没有安装。

这也是非常多包管理器或者生态环境不好用的原因所在。

另外，基础依赖，经常会成为隐式依赖。

在没有 commonjs 之前的 javascript 开发方式，某种程度上来说，都是这种情况。我们来看一个例子：

```js
// mymodule.js
(function(){
	var container = $('#container');
	...
})();
```

事实上，开发 mymodule.js 的开发者很有意识地进行了代码的拆分。

但假若另外一个开发者，刚刚从火星回来（因此不知道 jquery 是什么东西），他发现 mymodule.js 的 api 能够解决他的问题，因此他将该文件将其引用到页面中。这时候，页面会报错，报错的内容可能是

```
$ is not defined.
```

这个开发者会毫无头绪，不知道如何处置这个没有定义的 `$`。

这是一个极端的例子，但是我们设想一下，将这个 `$` 替换成其他的模块，或者当业务场景变得足够复杂，你需要大量这样的模块的时候，模块的管理会变得非常的头疼。

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