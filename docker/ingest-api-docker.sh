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
    echo 'DIR of script:' $DIR
}

# Generate the build version based on git branch name and short commit hash and write into BUILD file
function generate_build_version() {
    GIT_BRANCH_NAME=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
    GIT_SHORT_COMMIT_HASH=$(git rev-parse --short HEAD)
    # Clear the old BUILD version and write the new one
    truncate -s 0 ../BUILD
    # Note: echo to file appends newline
    echo $GIT_BRANCH_NAME:$GIT_SHORT_COMMIT_HASH >> ../BUILD
    # Remmove the trailing newline character
    truncate -s -1 ../BUILD
    
    echo "BUILD(git branch name:short commit hash): $GIT_BRANCH_NAME:$GIT_SHORT_COMMIT_HASH"
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
        # Always show the script dir
        get_dir_of_this_script

        # Always export and show the version
        export_version
        
        # Always show the build in case branch changed or new commits
        generate_build_version

        # Print empty line
        echo

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
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api config
        elif [ "$2" = "build" ]; then
            # Delete the copied source code dir if exists
            if [ -d "ingest-api-$1/src" ]; then
                rm -rf ingest-api-$1/src
            fi

            # Create docker copy of the source code
            mkdir ingest-api-$1/src
            cp -r ../src/ingest-api/* ingest-api-$1/src

            # Only mount the VERSION file and BUILD file for localhost and dev
            # On test/stage/prod, copy the VERSION file and BUILD file to image
            if [[ "$1" != "localhost" && "$1" != "dev" ]]; then
                cp VERSION ingest-api-$1/src
                cp BUILD ingest-api-$1/src
            fi

            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api build
        elif [ "$2" = "start" ]; then
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api up -d
        elif [ "$2" = "stop" ]; then
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api stop
        elif [ "$2" = "down" ]; then
            docker-compose -f docker-compose-ingest-api.$1.yml -p ingest-api down
        fi
    fi
fi
