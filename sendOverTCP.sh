#!/bin/bash
echo -n "$1;" | socat -t 0 tcp-connect:localhost:9988 -
