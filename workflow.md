# Workflow with Cortex
> Web development with more fun

## Preparation
> Preparation may quicken the process

### Install node.js

Visit [http://nodejs.org/](http://nodejs.org/), download and install.

Set up with `NODE_PATH` for node.js

### Install cortex

	git clone git@github.com:kaelzhang/cortex.git
	cd cortex
	# Maybe you should use `sudo`
	npm link
	
	# Linux and Mac OSX only for now
	bash install.sh

or install with one command:

	curl https://npmjs.org/install.sh | bash


## Workflow

#### 1. create a new repo 

It's recommended that you create your repo on [github](http://github.com) or your private gitlab server and then clone it to your local machine.

#### 2. clone it

#### 3. initialize

	ctx init --force
	# and configure your initial settings

`ctx init` will automatically add the current repository into the watching list.

#### 4. develop

make changes, submit your code to git server, and test your code at http://localhost:8765

**For most cases, all things will be done without your concern.**

**But, you might have to know some manual commands, esp for test version of cortex:**

#### 5. use foreign modules

	ctx install --save <module> <module> ...

#### 6. validate package.json

	ctx validate
	
#### 7. build your project
	
	ctx build
	


