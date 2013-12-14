# package.json

这里将说明 package.json 文件中各个属性的用法及含义。

## 规则说明

1. 为了避免跟原有的 package.json 的属性冲突，我们加入了一个新的命名空间 `'cortex'`。若未特别说明，下面的属性都是在 `'cortex'` 这个 field 之下。
2. cortex 会优先读取 `'cortex'` field 中的属性，若读取不到，会尝试去读取 package.json 根中的属性，如果仍然读取不到，则会认为是没有定义。


## main

类型：`path`

它定义了当前模块的主入口 JavaScript 文件，该文件的 `exports` 变量会作为 `require()` 方法的返回值。 

## ignores

类型： `Array.<Path>`，默认值为：

	[
		'.git',
        '.svn',
        '.DS_Store'
	]

它会告诉 cortex，在发布到 cortexjs.org（或者你自己搭建的服务器）的时候，需要忽略哪些文件。

默认情况下，cortex 会尝试去读取项目跟目录下的 .cortexignore，若该文件不存在，则会依次尝试读取 .npmignore, .gitignore, 但需要注意的是，cortex 仅读取顺序第一个存在的配置文件。

这些文件需要使用 [.gitignore 的规范](http://git-scm.com/docs/gitignore) 来编写。


## directories

遵照 [CommonJS Packages](http://wiki.commonjs.org/wiki/Packages/1.0) 规范，我们可以使用 `cortex.directories` 来说明某一个项目的目录结构。

在 Web 开发中，每个目录代表的意义会与 node.js 的开发不同，因此我们创建了一个 `cortex.directories` 的属性来做有些类似的事情。

### directories.dist

无默认值

若 `directories.dist` 已经定义，那么 cortex build 认为 `directories.dist` 中的文件已经预编译完成，而不会进行额外的处理。

但需要注意的是，如果 `scripts.build`（下面会讲到）已经定义，那么在执行 cortex build 命令的时候，仍然会执行 `scripts.build` 的脚本 ———— 但会跳过 cortex 预设的预编译脚本。

### directories.lib

默认为 `"lib"`

目前这个值没有直接使用，而更多地根据 `cortex.main` 属性来确定入口 JavaScript 文件的位置。

### directories.css

默认为 `"css"`

它用来说明 CSS 文件所存放的目录。

#### 特殊说明

如果你的项目中使用了 less（sass，或 stylus 等），则不能够将这些文件放到 `directories.css` 所指定的目录，这个目录中应该存放编译后的文件。

这种情况下，可以将 less 等脚本编译到 `directories.css` 做指定的目录，并且可以使用 `scripts.build` 来指定编译 less 需要的脚本命令，比如：

```
{
	"cortex": {
		"scripts": {
			"build": [
				"grunt less"
			]
		},
		"directories": {
			"css": "built_css"
		}
	}
}
```

并且将 less 脚本编译到 `'built_css'` 目录

### directories.template

默认为 `"template"`

用来存放模板文件。

目前这个属性并没有使用，但在未来某个项目里程碑中，可能会很快用到它。

## dependencies

类型为 `Object`

与 node.js 开发的 `dependencies` 类似, `cortex.dependencies` 用来定义当前模块的依赖项及版本。

#### 特别说明

绝大多数情况下，你 **不会也不建议** 直接用到这个属性，你可以使用 `cortex install` 的 '--save' 参数，使用该参数后，不仅会将指定的模块安装到本地电脑，同时也会将模块名字和版本信息存储到当前模块的 `cortex.dependencies` 中。

```
cortex install jquery --save
```

## asyncDependencies

类型为 `Object`

用来定义当前模块的动态依赖。

类似的，你可以使用 `cortex install xxx --save-async`，来写入这个值。


## scripts

用于用户自定义命令行脚本。它的作用类似于 hooks，能够在不同的生命周期中被执行。

#### scripts.build

类型为 `String` 或者 `Array.<string>`

该脚本会在 cortex build 命令的准备阶段执行。比如模块自己使用的 grunt 命令等。

如果有多条命令，请注意要写成 **数组** 的形式。目前还不支持 bash 的 pipe（`'|'`），如果需要这么做，可以使用 Makefile 来实现。

```
"scripts": {
    "build": "grunt"
}
```

也可以包含多条命令：

```
"scripts": {
    "build": [
        "grunt dev",
        "grunt"
    ]
}
```