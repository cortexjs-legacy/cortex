安装及部署
====

建议的安装环境
----
1. Linux 或 Mac OS X 系统
2. nodejs 及 npm 环境
3. git
4. 网络连接


程序安装
----
强烈 **不建议** 将 Cortex 安装在 Windows 系统上，Cortex 在 Windows 系统上没有进行完备的测试，如果有问题，请及时反馈问题。 

### 1. 安装 nodejs 及 npm

[下载地址](http://nodejs.org/download/)。请安装对应操作系统的安装包。

### 2. 下载 Cortex 程序包。
        
        git clone ssh://git@10.1.4.81:58422/cortex.git
        
或者手动下载程序包解压，并进行初始化安装：
        
        cd path/you/put/cortex/to/
        npm link