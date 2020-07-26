#!/bin/bash

# Pass the needed UIDs, GIDs, user names, and group names from environment variables specified in the child image docker-compose
BASE_USER_NAME=${BASE_USER_NAME}
BASE_USER_UID=${BASE_USER_UID}
BASE_USER_GID=${BASE_USER_GID}

ADMIN_FILE_USER_NAME=${ADMIN_FILE_USER_NAME}
ADMIN_FILE_USER_UID=${ADMIN_FILE_USER_UID}

CONSORTIUM_FILE_GROUP_NAME=${CONSORTIUM_FILE_GROUP_NAME}
CONSORTIUM_FILE_GROUP_GID=${CONSORTIUM_FILE_GROUP_GID}

GENOMIC_DATA_FILE_GROUP_NAME=${GENOMIC_DATA_FILE_GROUP_NAME}
GENOMIC_DATA_FILE_GROUP_GID=${GENOMIC_DATA_FILE_GROUP_GID}

echo "Starting ingest-api container under the mapped host user $BASE_USER_NAME UID: $BASE_USER_UID and GID: $BASE_USER_GID"

# Create a new user with the same host UID to run processes on container
# The Filesystem doesn't really care what the user is called,
# it only cares about the UID attached to that user
# Check if user `hive` already exists and don't recreate across container restarts
getent passwd $BASE_USER_UID > /dev/null 2&>1
# $? is a special variable that captures the exit status of last task
if [ $? -ne 0 ]; then
    groupadd -r -g $BASE_USER_GID $BASE_USER_NAME
    useradd -r -u $BASE_USER_UID -g $BASE_USER_GID -m $BASE_USER_NAME
fi

# Only create user `shirey` based on the ADMIN_FILE_USER_UID, no group
getent passwd $ADMIN_FILE_USER_UID > /dev/null 2&>1
if [ $? -ne 0 ]; then
    useradd -r -u $ADMIN_FILE_USER_UID -m $ADMIN_FILE_USER_NAME
fi

# Only create group `hubmap` based on the CONSORTIUM_FILE_GROUP_GID
getent group $CONSORTIUM_FILE_GROUP_GID > /dev/null 2&>1
if [ $? -ne 0 ]; then
    groupadd -r -g $CONSORTIUM_FILE_GROUP_GID $CONSORTIUM_FILE_GROUP_NAME
fi

# Only create group `hubseq` based on the GENOMIC_DATA_FILE_GROUP_GID
getent group $GENOMIC_DATA_FILE_GROUP_GID > /dev/null 2&>1
if [ $? -ne 0 ]; then
    groupadd -r -g $GENOMIC_DATA_FILE_GROUP_GID $GENOMIC_DATA_FILE_GROUP_NAME
fi

# When running Nginx as a non-root user, we need to create the pid file
# and give read and write access to /var/run/nginx.pid, /var/cache/nginx, and /var/log/nginx
# In individual nginx *.conf, also don't listen on ports 80 or 443 because 
# only root processes can listen to ports below 1024
touch /var/run/nginx.pid
chown -R $BASE_USER_NAME:$BASE_USER_NAME /var/run/nginx.pid
chown -R $BASE_USER_NAME:$BASE_USER_NAME /var/cache/nginx
chown -R $BASE_USER_NAME:$BASE_USER_NAME /var/log/nginx

# Also make the ssl certificate accessible
chown -R $BASE_USER_NAME:$BASE_USER_NAME /etc/pki/nginx

# Lastly we use gosu to execute our process "$@" as that user
# Remember CMD from a Dockerfile of child image gets passed to the entrypoint.sh as command line arguments
# "$@" is a shell variable that means "all the arguments"
exec /usr/local/bin/gosu $BASE_USER_NAME "$@"