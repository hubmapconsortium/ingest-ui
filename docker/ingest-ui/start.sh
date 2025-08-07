#!/bin/bash

# Replace the custom tags with deployment specific .env
python /usr/src/app/src/envs/env_tool.py /usr/src/app/src/.env /usr/src/app/src/build &

# Start nginx to serve the static build
nginx -g 'daemon off;'