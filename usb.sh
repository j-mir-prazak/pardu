#!/bin/bash
if [[ ! -z $1 ]]; then
	output=$(udevadm info "$1")
	echo "$output"
fi
