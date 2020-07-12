#!/bin/bash

# Pass the needed UIDs and GIDs from environment variables specified in the child image docker-compose
USER_HIVE_UID=${USER_HIVE_UID}
USER_HIVE_GID=${USER_HIVE_GID}
USER_SHIREY_UID=${USER_SHIREY_UID}
GROUP_HUBMAP_GID=${GROUP_HUBMAP_GID}
GROUP_HUBSEQ_GID=${GROUP_HUBSEQ_GID}

echo "Starting ingest-api container under the mapped host user 'hive' UID: $USER_HIVE_UID and GID: $USER_HIVE_GID"

# Create a new user with the same host UID to run processes on container
# The Filesystem doesn't really care what the user is called,
# it only cares about the UID attached to that user
# Check if user `hive` already exists and don't recreate across container restarts
getent passwd $USER_HIVE_UID > /dev/null 2&>1
# $? is a special variable that captures the exit status of last task
if [ $? -ne 0 ]; then
    groupadd -r -g $USER_HIVE_GID hive
    useradd -r -u $USER_HIVE_UID -g $USER_HIVE_GID -m hive
fi

# Only create user `shirey` based on the USER_SHIREY_UID, no group
getent passwd $USER_SHIREY_UID > /dev/null 2&>1
if [ $? -ne 0 ]; then
    useradd -r -u $USER_HIVE_UID -m shirey
fi

# Only create group `hubmap` based on the GROUP_HUBMAP_GID
getent group $GROUP_HUBMAP_GID > /dev/null 2&>1
if [ $? -ne 0 ]; then
    groupadd -r -g $GROUP_HUBMAP_GID hubmap
fi

# Only create group `hubseq` based on the GROUP_HUBSEQ_GID
getent group $GROUP_HUBSEQ_GID > /dev/null 2&>1
if [ $? -ne 0 ]; then
    groupadd -r -g $GROUP_HUBSEQ_GID hubseq
fi

# When running Nginx as a non-root user, we need to create the pid file
# and give read and write access to /var/run/nginx.pid, /var/cache/nginx, and /var/log/nginx
# In individual nginx *.conf, also don't listen on ports 80 or 443 because 
# only root processes can listen to ports below 1024
touch /var/run/nginx.pid
chown -R hive:hive /var/run/nginx.pid
chown -R hive:hive /var/cache/nginx
chown -R hive:hive /var/log/nginx

# Also make the ssl certificate accessible
chown -R hive:hive /etc/pki/nginx

# Lastly we use gosu to execute our process "$@" as that user
# Remember CMD from a Dockerfile of child image gets passed to the entrypoint.sh as command line arguments
# "$@" is a shell variable that means "all the arguments"
exec /usr/local/bin/gosu hive "$@"