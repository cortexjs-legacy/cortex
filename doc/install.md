建议的安装环境
----
1. Linux 或 Mac OS X 系统
2. nodejs 及 npm 环境，[下载地址](http://nodejs.org/download/)。请安装对应操作系统的安装包。
3. git
4. 网络连接


程序安装
----
强烈 **不建议** 将 Cortex 安装在 Windows 系统上，Cortex 在 Windows 系统上没有进行完备的测试，如果有问题，请及时反馈问题。 


#### a. 从 npm 源安装
	sudo npm install cortex -g

或者
	
#### b. 获取项目源码后安装
	cd where/you/put/cortex/to/
	sudo npm link
	
程序升级
----

#### a. 从 npm 源升级
	sudo npm update cortex 

或者

#### b. 使用项目升级
	cd where/you/put/cortex/to/
	git pull
	sudo npm link