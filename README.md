# ![cortex](https://raw.githubusercontent.com/cortexjs/cortex/master/screenshots/logo+text.png)

[![NPM version](https://badge.fury.io/js/cortex.svg)](http://badge.fury.io/js/cortex) [![Build Status](https://travis-ci.org/cortexjs/cortex.svg?branch=master)](https://travis-ci.org/cortexjs/cortex)

**Cortex** is a package manager for the web with a bunch of full-stack frontend solutions to make your websites better, including:

<a href="http://book.ctx.io" target="_blank"><img align="right" alt="" src="https://raw.githubusercontent.com/cortexjs/cortex/master/screenshots/cover.png" /></a>

- Frontend package management with much better version control;
- Compatible backend solutions for JAVA and node.js (will open to public soon);
- Development environment for your entire workflow;
- [CI](http://en.wikipedia.org/wiki/Continuous_integration) solutions to support multiple testing environment simultaneously;
- Global registry service;
- CDN solutions.

With [Cortex](https://github.com/cortexjs/cortex), we write web modules **exactly** the same as we do with [node.js](http://nodejs.org), with no [Module/Wrappings](http://wiki.commonjs.org/wiki/Modules/Wrappings), no [AMD](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition), etc.

Cortex is designed and maintained for large websites and collaborative development and is also convenient for small projects.

We have a nice small book on gitbook.io: [The Handbook of Cortex](http://book.ctx.io)

## Installation

First, [node](http://nodejs.org) is required (>= 0.10.0), then run the following command in your command line:

```bash
$ npm install -g cortex
```

## Getting Started

Read this [Getting-Started Guide](http://ctx.io/get-started) to get a general view.

```bash
mkdir hello
cd hello
cortex init
cortex build
open index.html # Hello World! Everything you need is commented in the source code!
```

For more details about cortex, just visit our online gitbook: [The Handbook of Cortex](http://book.ctx.io/).


## Related

- [cvm](https://github.com/cortexjs/cvm): Cortex Version Manager
- [cortex-test](https://github.com/cortexjs/cortex-test): Cortex Test Plugin

## License

The [MIT](https://github.com/cortexjs/cortex/blob/master/LICENSE-MIT) license.

## Naming

The modular world is much like the nerve system. JavaScript packages interact with others by passing runtime objects as well as **neuron** cells processes and transmits chemical signals to others.

So, **cortex** is a neuron manager. That's it.

![neuron](https://raw.githubusercontent.com/cortexjs/cortex/master/screenshots/neurons.jpg)
