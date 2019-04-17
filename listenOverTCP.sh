#!/bin/bash
socat -u TCP-LISTEN:9989,reuseaddr,ignoreeof,fork SYSTEM:./tcpread.sh
