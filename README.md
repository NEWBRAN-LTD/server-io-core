# server-io-core

> A development server based on Koa, with built-it reload, watcher, remote debugger, proxy server and a few more features

This is a spin off from my [gulp-server-io](https://gitlab.com/newbranltd/gulp-server-io) (If you find it useful, please give it a star, thanks)

## Installation

To use this within your script

```
$ npm i server-io-core --save-dev
```
Or using yarn

```
$ yarn add server-io-core --dev
```

For example in your `index.js`

```js
'use strict';
const serverIoCore = require('server-io-core');
serverIoCore({
  webroot: ['/path/to/webroot', '/path/to/assets']
});
```

---

You can also use this package globally.

```
$ npm install server-io-core --global
```
Then call it from the command line:
```
$ server-io-core ./path/to/webroot,./path/to/assets
```
For more command line option
```
$ server-io-core --help
```

## Return objects

```js

const { webserver, app, start, stop, io } = serverIoCore({
  autoStart: false,
  webroot: ['/path/to/webroot', '/path/to/assets']
});
// if you provide this autoStart option, then you need to manually call the
// start stop method to start and stop the server
// And it will return the following
// webserver - the underlying http.server
// app - the Koa app
// start - a method to start the entire server
// stop - a method to stop the entire server and clean up
// io - if you enable socket then this will be the socket.io instance

```

NOTE: Socket will always enable unless you pass `{socket: false}` in the configuration.

## Usage

The following are all the features and how to enable them

### Basic

The minimal setup is pass the `webroot`.

```js
'use strict';
const serverIoCore = require('server-io-core');
serverIoCore({
  webroot: ['/path/to/webroot', '/path/to/assets']
});
```

By default, there is default value of

```js
{
  webroot: join(process.cwd(), 'app')
}
```

But the serving directory should be where your destination directory is.

It's recommended to pass a full path to the webroot option.

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

As you can see from above example, you can pass an array of directories, and it will
able to serve up content from them all. If you pass the `webroot` as string, it will
get converted to array.

With this minimum setup, you will have the follow features enable automatically:

* Webserver, start from `http://localhost:8000` using `index.html` as default.
* Open the in your default browser
* Reload will be watch the `webroot` whenever any files change in those directories, the web browser will reload. You can see the message from your console.
* Debugger a javascript debugger which capture the `Error` object from your browser document, and display within your console, nicely formatted with `stacktrace`. This is especially useful when you need to test HTML web app from a mobile device (there is no console.log!). Check debugger for more options

#### Host, port options

By default the host is `localhost` and port is `8000`. You can change them easily.

```js
// same as above
serverIoCore({
  webroot: '/path/to/webroot',
  port: 34567,
  host: '0.0.0.0' // if you don't provide this param, it will calculate it based on your platform
});
```

### Open

Open option is using [opn](https://www.npmjs.com/package/opn) internally. By default this is enable, you can disable it using `open:false` option.

You can also pass the option as an object

```js
// same as above
serverIoCore({
  webroot: '/path/to/webroot',
  open: {
    enable: false
  }
})
```

If you need to specify what browser to open:

```js
// same as above
serverIoCore({
  webroot: '/path/to/webroot',
  open: {
    browser: 'firefox'
  }
});
```

You can also open multiple browsers at once:

```js
serverIoCore({
  webroot: '/path/to/webroot',
  open: {
    browser: [
      'firefox',
      'google-chrome'
    ]
  }
});

```

_Please note, the name of browser is different on different platform. So you need to check the names.
Also use the core `os` package to determine where you are running_

The `browser` option will only accept `string` or `array`. And the browser (Array) option can accept
`array` as well. Look at this example from [opn](https://www.npmjs.com/package/opn):

```js
opn('http://sindresorhus.com', {app: ['google chrome', '--incognito']});
```

So you can pass option like this:

```js
serverIoCore({
  webroot: '/path/to/webroot',
  open: {
    browser: [
      ['google chrome', '---incognito'],
    ]
  }
});
```

Please note you need to pass as array of array.

### Reload

Reload is enable by default. It will watch the `webroot` and whenever file change, the browser will reload. You can disable this option by pass `reload:false`

```js
// same as above
serverIoCore({
  webroot: '/path/to/weboot',
  reload: false
})
```

If reload is enable, you should able to see a message like this from your dev tool:

```txt
reload nsp init connection IO RELOAD is listening ...
```

There are quite a few options available but they might get remove in the future. So not going to list
them here until final release.

### Debugger

Debugger is enable by default, again you can disable it by passing `debugger: false`

```js
// same as above
serverIoCore({
  webroot: '/path/to/webroot',
  debugger: false
});
```

When you enable it, there are several files get inject into your HTML document automatically. And using a socket.io server to communicate between the client and server. When a Javascript error happen. Your console might see something like this

```sh
[21:54:37] io debugger msg @ Thu Aug 02 2018 21:54:37 GMT+0800 (CST)
[21:54:37] FROM: error
[21:54:37] browser: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/67.0.3396.99 Chrome/67.0.3396.99 Safari/537.36
[21:54:37] location: http://localhost:8000/
[21:54:37] MESSAGE(S):
[21:54:37] ------------------------------------------------------------------------------------------
[21:54:37] columnNumber: 17
[21:54:37] lineNumber: 84
[21:54:37] fileName: http://localhost:8000/
[21:54:37] functionName: HTMLButtonElement.<anonymous>
[21:54:37] source:     at HTMLButtonElement.<anonymous> (http://localhost:8000/:84:17)
[21:54:37] ------------------------------------------------------------------------------------------
[21:54:37] columnNumber: 10315
[21:54:37] lineNumber: 3
[21:54:37] fileName: https://code.jquery.com/jquery-3.1.1.min.js
[21:54:37] functionName: HTMLButtonElement.dispatch
[21:54:37] source:     at HTMLButtonElement.dispatch (https://code.jquery.com/jquery-3.1.1.min.js:3:10315)
[21:54:37] ------------------------------------------------------------------------------------------
[21:54:37] columnNumber: 8342
[21:54:37] lineNumber: 3
[21:54:37] fileName: https://code.jquery.com/jquery-3.1.1.min.js
[21:54:37] functionName: HTMLButtonElement.q.handle
[21:54:37] source:     at HTMLButtonElement.q.handle (https://code.jquery.com/jquery-3.1.1.min.js:3:8342)
[21:54:37] ------------------------------------------------------------------------------------------ END
```

There is an additional method  `console.debug` inject into the windows document. You can use this within your own Javascript code to trigger debug message display in the console. This is especially useful when you use real mobile device to debug your web app.

To disable this option you can pass the following option:

```js
// same as above
serverIoCore({
  webroot: '/path/to/webroot',
  debugger: {
    consoleDebug: false
  }
});
```

There are many more options, but some might be gone in the final release. We will up date this document later.

### Inject

You can automatically inject assets files to your HTML document:

```js
// same as above
serverIoCore({
  webroot: '/path/to/webroot',
  inject: {
    source: [
      // DummyJs,
      'css/bootstrap.min.css',
      'css/starter-template.css',
      'js/bootstrap.min.js',
      'js/ie10-viewport-bug-workaround.js'
    ]
  }
});
```

The CSS files will be inject in the `head` and the JS files will be inject above the `body`.

**@TODO this option will be available in the future release**

You can specify where you want the files get injected, using the following option:

```js
// same as above
serverIoCore({
  webroot: '/path/to/webroot',
  inject: {
    source: {
      // DummyJs,
      head: [
        'css/bootstrap.min.css',
        'css/starter-template.css',
        'path/to/jquery.js'
      ],
      body: [
        'js/bootstrap.min.js',
        'js/ie10-viewport-bug-workaround.js'
      ]
    ]
  }
});
```

### Https

```js
serverIoCore(
  {
    https: true
  }
);
```

This will use the included snake oil certificate for testing purpose. This is particular useful if you are
developing [AMP](https://www.ampproject.org/) or [PWA](https://developers.google.com/web/progressive-web-apps/) apps.



### Proxy

We are using the [koa-nginx](https://github.com/wedog/koa-nginx) as the proxy option. To create a proxy:

```
serverIoCore(
  {
    proxies: [{
      host: `http://localhost:5678`,
      context: 'proxy'
    }]
  }
);
```

From your code, you just call `/proxy` and it will redirect to the http://localhost:5678


### Mock Server

**This is remove and no longer support, you can easily add this as a middleware.**

### Server Reload

**This is removed and no longer support, you can use nodemon instead.**

### Debug

We use debug internally, so you can pass `DEBUG=server-io-core*` during start up in to your node environment to check out what is going inside the package.

---

If you like this, please give [server-io-core](https://gitlab.com/newbranltd/server-io-core) a star, thanks.

---

LICENSE: MIT

Brought to you by [NEWBRAN.CH](https://newbran.ch) / [Joel Chu](https://joelchu.com)
