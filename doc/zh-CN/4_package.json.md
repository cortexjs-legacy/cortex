# package.json

本文档说明 package.json 文件中各个属性的用法及含义。

## Cortex Properties

为了避免跟原有的 package.json 的属性冲突，我们加入了一个新的命名空间 `'cortex'`.

### cortex.main

类型：`Path`

它定义了当前模块的主入口 JavaScript 文件，该文件的 `exports` 变量会作为 `require()` 方法的返回值。 

### cortex.ignores

类型： `Array.<Path>`，默认值为：

	[
		'.git',
        '.svn',
        '.DS_Store'
	]

它会告诉 cortex，在发布到 ctx.io（或者你自己搭建的服务器）的时候，需要忽略哪些文件。

默认情况下，cortex 会尝试去读取项目跟目录下的 .cortexignore，若该文件不存在，则会依次尝试读取 .npmignore, .gitignore, 并仅读取顺序第一个发现的配置文件。

这些文件需要使用 [.gitignore 的规范](http://git-scm.com/docs/gitignore) 来编写。


### cortex.directories

遵照 [CommonJS Packages](http://wiki.commonjs.org/wiki/Packages/1.0) 规范，我们可以使用 `'directories'` 来说明某一个项目的目录结构。

在 Web 开发中，每个目录代表的意义会与 node.js 的开发不同，因此我们创建了一个 `cortex.directories` 的属性来做有些类似的事情。

#### directories.dist

无默认值

若 `directories.dist` 已经定义，那么 cortex build 认为 `directories.dist` 中的文件已经预编译完成，而不会进行额外的处理。

#### directories.lib

默认为 `"lib"`

目前这个值没有直接使用，而更多地根据 `cortex.main` 属性来确定入口 JavaScript 文件的位置。

#### directories.css

默认为 `"css"`

它用来说明 CSS 文件所存放的目录。**请注意**，如果你的项目中使用了 less（sass，或 stylus 等），则不能够将这些文件放到 `directories.css` 所指定的目录，这个目录中应该存放编译后的文件。

#### directories.template

默认为 `"template"`

用来存放模板文件。

目前这个属性并没有使用，在未来某个项目里程碑中，可能会用到它。

### dependencies

类型为 `Object`

与 node.js 开发的 `dependencies` 类似, `cortex.dependencies` 用来定义当前模块的依赖项及版本。

但是绝大多数情况下你不会直接用到这个属性，你可以使用 `cortex install` 的 '--save' 参数，使用该参数后，不仅会将指定的模块安装到本地电脑，同时也会将模块名字和版本信息存储到当前模块的 `cortex.dependencies` 中。

### scripts

用于用户自定义命令行脚本。

#### scripts.build

类型为 `String` 或者 `Array.<string>`

该脚本会在 cortex build 命令的准备阶段执行。比如模块自己使用的 grunt 命令等。

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