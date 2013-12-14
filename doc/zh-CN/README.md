# Cortex

Cortex 是是一个针对浏览器端应用而设计的前端开发环境和模块管理器，特别为基于 [CommonJS](http://wiki.commonjs.org) 开发的前端项目而设计。

使用 cortex，你能够：

## 使用 [node.js](http://nodejs.org) 的方式来开发 web 应用

- 能够在浏览器中使用 node.js 常见的模块
- 直接使用 [CommonJS: Modules/1.0](http://wiki.commonjs.org/wiki/Modules/1.0) 规范来编写模块，即与 node.js **完全** 一样。
- 可以忘记 RequireJS，忘记 AMD 规范，或者其他类似的东西。

## 精确而强大的版本控制策略

Cortex 基于 [Semantic Versioning](http://semver.org/) （语义化版本控制）及最新的 [semver 3.0.0](https://github.com/mojombo/semver/issues/113)（语义化版本范围描述，semver range expression）来进行版本控制，能够做到：

- 任何的框架或组件的 bug fixes 能够平滑覆盖所有业务进行
- 不兼容的改动能够不影响到老业务
- 多版本线上并存

这几点对于大型企业级应用，尤为重要，能够做到稳重与快速并重 —— 既可以让框架升级抛开沉重的担子，也能够让业务没有后顾之忧。


## 简单易上手

Cortex 的使用方法，与 [npm](http://npmjs.org) 很类似。如果你进行过 node.js 的开发，会很容易使用 cortex。

另外，cortex 从设计上，尽量减少开发者需要进行配置的工作。

我们的理念是：

**让开发者抛开写代码之外的一切工作**

之所以能够做到这一点，是因为 cortex 提供了：


## 从前到后完整的解决方案

Cortex 不是在单打独斗，周边我们有一系列的完整的解决方案来完成诸如：

- 创建环境
- 一键式的发布上线
- 上线后的优化：基于算法的自动打包合并，压缩等等

这些周边的组件包括：

- 能够在公司内部搭建的模块库
- 供服务器端程序使用的与前端模块相关的中间件
- 持续集成解决方案
- 基于统计与算法的自动性能优化系统


## 一键搭建测试或开发环境

Cortex server 能够一键启动测试环境或者本地开发环境。

