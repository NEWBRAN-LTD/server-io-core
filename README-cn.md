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

---

更多即将到来