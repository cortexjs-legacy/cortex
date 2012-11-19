Cortex 约定
====

### 1. 打包目录相关

目录：build/

单个包的结构：build/build\_Y-M-D\_h-m-s/

cortex 缓存目录：build/.cortex/


### 2. Filter 开发

1. 若 filter 为单例，则 exports 需要包含三个方法：
	- setup
	- run
	- tearDown
	
2. 若 filter 的实现中，为一个构造器，则 exports 需要包含：
	- create

	且，create 方法会创建一个包含 {1} 中三个方法的实例。