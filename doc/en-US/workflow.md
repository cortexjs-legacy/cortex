# Workflow with Cortex
> Web development with more fun

## Preparation
> Preparation may quicken the process

### Install node.js

Visit [http://nodejs.org/](http://nodejs.org/), download and install.

Set up with `NODE_PATH` for node.js

### Install cortex

	npm install -g cortex


## Workflow

#### 1. create a new repo 

It's recommended that you create your repo on [github](http://github.com) or your private gitlab server and then clone it to your local machine.

#### 2. clone it

#### 3. initialize

	cortex init --force
	# and configure your initial settings

`cortex init` will automatically add the current repository into the watching list.

#### 4. develop

make changes, submit your code to git server, and test your code at http://localhost:9074

**For most cases, all things will be done without your concern.**

**But, you might have to know some manual commands, esp for test version of cortex:**

#### 5. use foreign modules

	cortex install [--save] <module> <module> ...

#### 6. validate package.json

	cortex validate
	
#### 7. build your project
	
	cortex build
	


