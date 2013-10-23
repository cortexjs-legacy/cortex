# install

安装依赖

    cortex install [module]
    
## 描述

类似`npm install`，安装项目所需要的依赖。

## 示例

### 安装项目依赖 
	npm install

### 安装模块最新版本（若忽略版本，默认为latest）
	npm install request@latest
	
### 安装模块特定版本
	npm install request@0.1.0

### 安装多个模块
	npm install request class@0.1.0 lang

### 将模块依赖保存在package.json中
	npm install request@0.1.1 --save