#!/bin/bash
export DISPLAY=:0
if [[ -z $1 ]]; then
	echo "no command specified"
else
	if [[ $1 == "test" ]] && [[ ! -z $2 ]]; then
		xinput test $2
	elif [[ $1 == "list" ]]; then
		xinput --list
	fi
fi
