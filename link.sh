#!/bin/bash

__dirname=`pwd`

sudo ln -sf "$__dirname/bin/cortex-cli.js" "/usr/local/bin/cortex"
echo "$__dirname/bin/cortex-cli.js -> /usr/local/bin/cortex"