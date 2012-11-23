用法
====

1. ctx help 查看可用命令
2. ctx help \<action\> 查看具体命令参数


可用的 \<action\>
----
* package 打包项目

* upload 上传项目

* fail 标记项目更新失败（过度方案）


关于全局参数
----
对于大多数项目都需要使用的全局参数，或者不适合直接在脚本中公开的隐私数据，可以使用全局的配置文件来进行。

Cortex 有三层的参数配置：

1. 第一层是命令中的参数，比如 `ctx package -e alpha -f css,closure,md5`，其中，-e 和 -f 就是命令参数，它们对应于缩写的完整名称 \-\-env, \-\-filters

2. 第二层是当前工作目录的参数，它会由命令参数中的 \-\-cwd 和 \-\-env 参数而影响。当前工作目录的参数由 `<cwd>/.cortex/<action>.<env>.json` 文件来决定。

3. 第三层为用户全局参数，它会由 `~/.cortex/<action>.<env>.json` 文件来决定


并且，这三层参数的优先级为：

	命令参数 > 工作目录参数 > 用户全局参数
	
也就是说，假若在某台发布机上，所有的项目打包，在 alpha 环境下，都需要使用 css, closure, md5 三个过滤器，那么可以在 ~/.cortex/package.alpha.json 中定义

	{
		"filters": "css,closure,md5"
	}