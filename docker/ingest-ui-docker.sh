#!/bin/bash

function absent_or_newer () {
    if  [ \( -e $1 \) -a \( $2 -nt $1 \) ]; then
        echo "$1 is out of date"
        exit -1
    fi
}

if [[ "$1" != "localhost" && "$1" != "dev" && "$1" != "test" && "$1" != "stage" && "$1" != "prod" ]]; then
    echo "Unknown build environment '$1', specify one of the following: 'localhost', 'dev', 'test', 'stage', or 'prod'"
else
    if [[ "$2" != "build" && "$2" != "start" && "$2" != "stop" && "$2" != "check" && "$2" != "config" ]]; then
        echo "Unknown command '$2', specify 'build' or 'start' or 'stop' or 'check' or 'config' as the second argument"
    else
        if [ "$2" = "build" ]; then
            # Use the `source` command to execute ./docker-setup.sh in the current process 
            # since that script contains export environment variable
            source ./docker-setup-ingest-ui.sh
            docker-compose -f docker-compose-ingest-ui.$1.yml build
        elif [ "$2" = "start" ]; then
            docker-compose -p ingest-ui -f docker-compose-ingest-ui.$1.yml up -d
        elif [ "$2" = "stop" ]; then
            docker-compose -p ingest-ui -f docker-compose-ingest-ui.$1.yml stop
        elif [ "$2" = "check" ]; then
            # Bash array
            config_paths=(
                '../src/ingest-ui/.env'
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
            absent_or_newer ingest-ui/src ../src/ingest-ui

            echo 'Checks complete, all good :)'
        elif [ "$2" = "config" ]; then
            # Export the VERSION as environment variable
            # Without using `source` command, this export is only for display purpose with config
            export INGEST_UI_VERSION=$(tr -d "\n\r" < ../VERSION | xargs)
            echo "###### INGEST-UI $INGEST_UI_VERSION ########"
            docker-compose -p ingest-ui -f docker-compose-ingest-ui.yml config
        fi
    fi
fi
