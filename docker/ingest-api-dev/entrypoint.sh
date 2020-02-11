#!/bin/bash

# Pass the HOST_UID from an environment variable specified in the child image docker-compose,
# defaulting to 9000 if it doesn't exist
HOST_UID=${HOST_UID:-9000}

echo "Starting ingest-api container with the same host UID: $HOST_UID"

# Create a new user with the same host UID to run processes on container
# The Filesystem doesn't really care what the user is called,
# it only cares about the UID attached to that user
useradd -r -u $HOST_UID -o -c "" -m hubmap

# Lastly we use gosu to execute our process "$@" as that user
# Remember CMD from a Dockerfile of child image gets passed to the entrypoint.sh as command line arguments
# "$@" is a shell variable that means "all the arguments"
exec /usr/local/bin/gosu hubmap "$@"