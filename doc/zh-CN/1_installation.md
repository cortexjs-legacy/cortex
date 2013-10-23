# 安装

	npm install cortex -g

## 配置

大部分的时候，不需要任何额外的配置，就可以使用 cortex 绝大部分的功能。

在某些场景下，可能需要进行部分的配置。

#### 场景：使用自建的 registry（模块仓库）

在命令行中运行：

	cortex config registry

可能会出现如下提示，并根据交互输入有效的新 regsitry 地址（URL）即可

    [?] value: (http://registry.ctx.io/)


#### 场景：提交模块到远程仓库

提交模块到远程仓库之前，需要到 ctx.io 上登录。当然，你需要在命令行中完成这个操作。

    cortex adduser

然后根据交互提示进行下面的操作，具体可参见 `cortex adduser` 命令。

