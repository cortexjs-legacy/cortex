#!/bin/bash

__dirname=`pwd`

sudo ln -sf "$__dirname/bin/cortex-cli.js" "/usr/local/bin/cortex"
echo "$__dirname/bin/cortex-cli.js -> /usr/local/bin/cortex"

sudo ln -sf "$__dirname" "/usr/local/lib/node_modules/cortex"
echo "$__dirname -> /usr/local/lib/node_modules/cortex"
