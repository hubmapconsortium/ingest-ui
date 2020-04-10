#!/bin/bash

# Pass the HOST_UID and HOST_UID from environment variables specified in the child image docker-compose
HOST_GID=${HOST_GID}
HOST_UID=${HOST_UID}
HOST_GLOBUS_MOUNT_DIR=${HOST_GLOBUS_MOUNT_DIR}

echo "Starting ingest-api container with the same host user UID: $HOST_UID and GID: $HOST_GID"

# Create a new user with the same host UID to run processes on container
# The Filesystem doesn't really care what the user is called,
# it only cares about the UID attached to that user
# Check if user already exists and don't recreate across container restarts
getent passwd $HOST_UID > /dev/null 2&>1
# $? is a special variable that captures the exit status of last task
if [ $? -ne 0 ]; then
    groupadd -r -g $HOST_GID hubmap
    useradd -r -u $HOST_UID -g $HOST_GID -m hubmap
fi

# When running as non-root user, we'll make sure the mounted
# globus directory is owned by hubmap user as well
chown -R hubmap:hubmap $HOST_GLOBUS_MOUNT_DIR

# Lastly we use gosu to execute our process "$@" as that user
# Remember CMD from a Dockerfile of child image gets passed to the entrypoint.sh as command line arguments
# "$@" is a shell variable that means "all the arguments"
exec /usr/local/bin/gosu hubmap "$@"