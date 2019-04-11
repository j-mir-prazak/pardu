#!/bin/bash

for i in /dev/ttyUSB*; do
	output=$(udevadm info "$i")
	echo "$output"
	echo "----------------------------------"
	echo "$output" | grep VENDOR
done
