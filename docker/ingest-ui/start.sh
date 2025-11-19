#!/bin/bash

# Replace the custom tags with deployment specific .env
# NOTE: Explicitly call the Python executable with its full path instead of just `python` or `python3.13`
# This is due to the api-base-image v1.2.0 uses aliases
/usr/local/bin/python3.13 /usr/src/app/src/envs/env_tool.py /usr/src/app/src/.env /usr/src/app/src/build &

# Start nginx to serve the static build
nginx -g 'daemon off;'