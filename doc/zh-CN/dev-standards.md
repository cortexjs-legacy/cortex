# 开发规范

Cortex 是开源项目，欢迎大家对 cortex 进行改进或在 cortex 基础上进行开发。目前标准的仓库在 [GitHub](https://github.com/cortexjs/cortex)。Cortex 的设计准则可以参见 [Cortex 设计原则](design-principle.md)

## 源码结构

主要源码都在 _/lib_ 目录下, 对源码进行阅读可以参照各个目录下的 _README.md_ 文件，有对目录下文件的结构和功能做简要的说明。如 _/lib/README.md_:

    command/
    cortex 各个命令的实现
    
    options/
    每个命令的参数和配置
    
    resources/
    本地化文件
    
    service/
    cortex 本地服务器相关文件和配置


## 如何提交修改的代码

作为开发者可以 fork 仓库到自己的帐户下。（你一定有 github 帐户的对吧， 什么?! 还没有，赶紧去注册一个吧)

你可以在自己 fork 的版本上进行修改，建议创建新的分支，如:

    git branch fixbug-xxxxx
    git branch feature-xxxxxx

    git checkout <new-branch>

当你已经完成程序的修改和编写，测试好了之后，便可以在 _GitHub_ 上提交 _Pull Request_了。 可以参考文章 [Creating a pull request](https://help.github.com/articles/creating-a-pull-request)


## 开发注意

* 在进行大的改进前请先在 google group 或者 mail group 中提出，以免重复劳动或者在错误的方向上前进
* 保证向后兼容, 不论是修改bug还是新增feature，都请保证现有的API和命令行接口。
