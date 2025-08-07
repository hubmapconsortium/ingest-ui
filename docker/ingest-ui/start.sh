#!/bin/bash

# Replace the custom tags with deployment specific .env
python ./envs/env_tool.py .env build &

# Start nginx to serve the static build
nginx -g 'daemon off;'