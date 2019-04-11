#/!/bin/bash

if [[ ! -d "./profiles/" ]]; then
	mkdir "profiles";
fi

if [[ $1 == "true" ]]; then
	cp -f ./profiles/* ~/.qlcplus/inputprofiles/
else
	cp -f ~/.qlcplus/inputprofiles/* ./profiles
fi
