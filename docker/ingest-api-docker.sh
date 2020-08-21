#!/bin/bash

# Print a new line and the banner
echo
echo "==================== INGEST-API ===================="

# The `absent_or_newer` checks if the copied src at docker/some-api/src directory exists 
# and if the source src directory is newer. 
# If both conditions are true `absent_or_newer` writes an error message 
# and causes script to exit with an error code.
function absent_or_newer () {
    if  [ \( -e $1 \) -a \( $2 -nt $1 \) ]; then
        echo "$1 is out of date"
        exit -1
    fi
}

# This function sets DIR to the directory in which this script itself is found.
# Thank you https://stackoverflow.com/questions/59895/how-to-get-the-source-directory-of-a-bash-script-from-within-the-script-itself                                                                      
function get_dir_of_this_script () {
    SCRIPT_SOURCE="${BASH_SOURCE[0]}"
    while [ -h "$SCRIPT_SOURCE" ]; do # resolve $SCRIPT_SOURCE until the file is no longer a symlink
        DIR="$( cd -P "$( dirname "$SCRIPT_SOURCE" )" >/dev/null 2>&1 && pwd )"
        SCRIPT_SOURCE="$(readlink "$SCRIPT_SOURCE")"
        [[ $SCRIPT_SOURCE != /* ]] && SCRIPT_SOURCE="$DIR/$SCRIPT_SOURCE" # if $SCRIPT_SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
    done
    DIR="$( cd -P "$( dirname "$SCRIPT_SOURCE" )" >/dev/null 2>&1 && pwd )"
}

# Set the version environment variable for the docker build
# Version number is from the VERSION file
# Also remove newlines and leading/trailing slashes if present in that VERSION file
function export_version() {
    export INGEST_API_VERSION=$(tr -d "\n\r" < ../VERSION | xargs)
    echo "INGEST_API_VERSION: $INGEST_API_VERSION"
}

if [[ "$1" != "localhost" && "$1" != "dev" && "$1" != "test" && "$1" != "stage" && "$1" != "prod" ]]; then
    echo "Unknown build environment '$1', specify one of the following: localhost|dev|test|stage|prod"
else
    if [[ "$2" != "setup" && "$2" != "check" && "$2" != "config" && "$2" != "build" && "$2" != "start" && "$2" != "stop" && "$2" != "down" ]]; then
        echo "Unknown command '$2', specify one of the following: setup|check|config|build|start|stop|down"
    else
        get_dir_of_this_script
        echo 'DIR of script:' $DIR

        if [ "$2" = "check" ]; then
            # Bash array
            config_paths=(
                '../src/ingest-api/instance/app.cfg'
            )

            for pth in "${config_paths[@]}"; do
                if [ ! -e $pth ]; then
                    echo "Missing file (relative path to DIR of script) :$pth"
                    exit -1
                fi
            done

            absent_or_newer ingest-api-$1/src ../src/ingest-api

            echo 'Checks complete, all good :)'
        elif [ "$2" = "config" ]; then
            export_version
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api config
        elif [ "$2" = "build" ]; then
            # Delete the copied source code dir if exists
            if [ -d "ingest-api-$1/src" ]; then
                rm -rf ingest-api-$1/src
            fi

            # Create docker copy of the source code
            mkdir ingest-api-$1/src
            cp -r ../src/ingest-api/* ingest-api-$1/src
            
            export_version
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api build
        elif [ "$2" = "start" ]; then
            export_version
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api up -d
        elif [ "$2" = "stop" ]; then
            export_version
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api stop
        elif [ "$2" = "down" ]; then
            export_version
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api down
        fi
    fi
fi
