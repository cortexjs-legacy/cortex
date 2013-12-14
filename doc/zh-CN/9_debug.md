## 在线调试

### 使用 neocortex 的项目

neocortex 是 cortex 生态系统中，专门针对服务器端而设计的一环。使用 neocortex，会给线上调试工作带来极大的便利。

可以安装 chrome 插件 [cortex-cookie-manager](https://chrome.google.com/webstore/detail/cortex-cookie-manager/gdcahccbgbmjkadajipnfjloflibhjop?hl=en-US)。

#### 引流静态文件到本地

点击浏览器工具栏中的 ![chrome-icon](https://raw.github.com/kaelzhang/cortex/master/screenshots/chrome-icon.png) 图标，

之后，页面中的静态文件（目前仅支持 JavaScript）会指向本地的 cortex server。

#### 启动本地静态服务器

```sh
cortex server
```

此时，一个完整的本地测试环境会完全安装完成。

**你可能要问，静态文件还不是没有安装到本地吗？**

这个时候，cortex server 会做完所有的事情，包括，根据静态文件的地址来下载相对应的模块到本地，并且进行 “编译”，并且发布到本地服务器地址上。

cortex 如何能够知道从哪里下载

#### 调试具体模块


### 普通项目

