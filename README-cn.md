# server-io-core

> 基于 Koa 的开发服务器, 具有内置的重新加载、观察程序、远程调试器、代理服务器和其他一些功能.

这是我 [gulp-freeal-io](http://gitlab. com/newbrantd/gulp-fergop-eio) 的一个分支 (如果你觉得有用, 请给它一个明星, 谢谢)

## 安装

在脚本中使用此功能

```
$ npm i server-io-core --save-dev
```
或使用 yarn

```
$ yarn add server-io-core --dev
```

例如, 在您的 `index. js` 中

```js
'use strict';
const serverIoCore = require('server-io-core');
serverIoCore({
  webroot: ['/path/to/webroot', '/path/to/assets']
});
```

---

您也可以在全局范围内使用此包。

```
$ npm install server-io-core --global
```
然后从命令行调用它:
```
$ server-io-core ./path/to/webroot,./path/to/assets
```
有关更多命令行选项
```
$ server-io-core --help
```

## 返回对象

```js

const { webserver, app, start, stop, io } = serverIoCore({
  autoStart: false,
  webroot: ['/path/to/webroot', '/path/to/assets']
});
// 如果提供此自动启动选项,则需要手动调用
// 启动停止方法以启动和停止服务器
// 它将返回以下内容
// webserver - 基础 http.server
// app - Koa 应用程序
// start - 启动整个服务器的方法
// stop - 停止整个服务器并清理的方法
// io - 如果启用套接字,这将是socket.io实例

```

注: 除非在配置中传递"套接字:false",否则socket将始终启用。

## 使用

以下是所有功能以及如何启用它们

### 基本

最小设置是传递"webroot"。

```js
'use strict';
const serverIoCore = require('server-io-core');
serverIoCore({
  webroot: ['/path/to/webroot', '/path/to/assets']
});
```

默认情况下,默认值为

```js
{
  webroot: join(process.cwd(), 'app')
}
```

但是,服务目录应位于目标目录的位置。

建议将完整路径传递给 Webroot 选项。

```js
'use strict';
const server = require('server-io-core');
const { join } = require('path');

server({
  webroot: [
    join(__dirname, 'path', 'to', 'dist'),
    join(__dirname, 'path', 'to', 'assets')
  ]
});

```

正如您从上面的例子中看到的,你可以传递一个目录数组,它会
能够提供所有内容。如果将"Webroot"作为字符串传递,它将
转换为数组。

使用此最小设置,将自动启用以下功能:

* Web 服务器,从"http://localhost:8000"开始,使用"index.html"作为默认值。
* 在默认浏览器中打开
* 重新加载将观看"Webroot",每当任何文件在这些目录中更改,Web 浏览器将重新加载。可以从主机看到消息。
* 调试器 javascript 调试器,从浏览器文档捕获"错误"对象,并在控制台中显示,格式为"堆栈跟踪"。当您需要从移动设备测试 HTML Web 应用(没有控制台.log!)时,此功能特别有用。检查调试器以了解更多选项


---

更多即将到来
