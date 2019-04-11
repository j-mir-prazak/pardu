#/!/bin/bash

if [[ ! -d "./profiles/" ]]; then
	mkdir "profiles";
fi

if [[ $1 == "true" ]]; then
	#true copies profiles to qlc folder
	cp -f ./profiles/* ~/.qlcplus/inputprofiles/
else
	cp -f ~/.qlcplus/inputprofiles/* ./profiles
fi
