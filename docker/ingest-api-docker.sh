#!/bin/bash

function absent_or_newer () {
    if  [ \( -e $1 \) -a \( $2 -nt $1 \) ]; then
        echo "$1 is out of date"
        exit -1
    fi
}

# This script only handles the build/start/stop of ingest-api on dev, test, and prod
if [[ "$1" != "dev" && "$1" != "test" && "$1" != "stage" && "$1" != "prod" ]]; then
    echo "Unknown build environment '$1', specify one of the following: 'dev', 'test', 'stage', or 'prod'"
else
    if [[ "$2" != "build" && "$2" != "start" && "$2" != "stop" && "$2" != "check" && "$2" != "config" ]]; then
        echo "Unknown command '$2', specify 'build' or 'start' or 'stop' or 'check' or 'config' as the second argument"
    else
        if [ "$2" = "build" ]; then
            # Use the `source` command to execute ./docker-setup.sh in the current process 
            # since that script contains export environment variable
            source ./docker-setup-ingest-api.$1.sh
            docker-compose -f docker-compose-ingest-api.$1.yml build
        elif [ "$2" = "start" ]; then
            docker-compose -p ingest-api -f docker-compose-ingest-api.$1.yml up -d
        elif [ "$2" = "stop" ]; then
            docker-compose -p ingest-api -f docker-compose-ingest-api.$1.yml stop
        elif [ "$2" = "check" ]; then
            # Bash array
            config_paths=(
                '../src/ingest-api/instance/app.cfg'
            )

            for pth in "${config_paths[@]}"; do
                if [ ! -e $pth ]; then
                    echo "Missing $pth"
                    exit -1
                fi
            done

            # The `absent_or_newer` checks if the copied src at docker/some-api/src directory exists 
            # and if the source src directory is newer. 
            # If both conditions are true `absent_or_newer` writes an error message 
            # and causes hubmap-docker.sh to exit with an error code.
            absent_or_newer ingest-api-$1/src ../src/ingest-api

            echo 'Checks complete, all good :)'
        elif [ "$2" = "config" ]; then
            # Export the VERSION as environment variable
            # Without using `source` command, this export is only for display purpose with config
            export INGEST_API_VERSION=$(tr -d "\n\r" < ../VERSION | xargs)
            echo "###### INGEST-API $INGEST_API_VERSION ########"
            docker-compose -p ingest-api -f docker-compose-ingest-api.$1.yml config
        fi
    fi
fi
