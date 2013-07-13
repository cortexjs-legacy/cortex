#!/bin/bash

# You should NEVER run this as `sudo bash install.sh`, or you will use a wrong rsa_id

# Mac OSX ONLY so far
# If 'Password:' is asking, enter your superadmin password

path="/usr/local/bin/"

links=(cortex ctx ctx-build ctx-help ctx-init ctx-install ctx-server ctx-validate) 

for link in ${links[@]}
do
	echo "remove old ctx command: $link"
	sudo rm -f "$path$link"
done

sudo npm link

# create init task
mkdir -p ~/.grunt-init/

echo "remove old grunt-init-neuron"
rm -rf ~/.grunt-init/neuron
git clone git@github.com:supersheep/grunt-init-neuron.git ~/.grunt-init/neuron

# prepare woking directories
mkdir -p ~/.cortex/built_modules
mkdir -p ~/.cortex/modules
touch ~/.cortex/stable_modules
rm ~/.cortex/stable_modules
echo "{}" > ~/.cortex/stable_modules
echo "Cortex successfully installed!"



