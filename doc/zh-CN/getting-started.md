## Cortex 开发者使用指南

## 简介

Cortex **不是**一个任务构建工具， **不是**一个版本管理工具；

而是一个针对浏览器端开发的前端环境和模块管理器，特别为基于 [CommonJS](http://wiki.commonjs.org) 开发的前端项目而设计。它提供：

- 基于 [CommonJS:Modules/1.0](http://wiki.commonjs.org/wiki/Modules/1.0) 的 wrapping 服务，可以 **让开发者完全使用 Node.js 的方式来开发 web 应用**
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


