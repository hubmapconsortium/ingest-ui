#!/bin/bash

# Print a new line and the banner
echo
echo "==================== INGEST-UI ===================="

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

# Generate the build version based on git branch name and short commit hash
# Here just pince ingest-api actually writes the the BUILD file
function generate_build_version() {
    GIT_BRANCH_NAME=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
    GIT_SHORT_COMMIT_HASH=$(git rev-parse --short HEAD)
    echo "BUILD(git branch name:short commit hash): $GIT_BRANCH_NAME:$GIT_SHORT_COMMIT_HASH"
}

# Set the version environment variable for the docker build
# Version number is from the VERSION file
# Also remove newlines and leading/trailing slashes if present in that VERSION file
function export_version() {
    export INGEST_UI_VERSION=$(tr -d "\n\r" < ../VERSION | xargs)
    echo "INGEST_UI_VERSION: $INGEST_UI_VERSION"
}

if [[ "$1" != "check" && "$1" != "config" && "$1" != "build" && "$1" != "start" && "$1" != "stop" && "$1" != "down" ]]; then
    echo "Unknown command '$1', specify one of the following: check|config|build|start|stop|down"
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
            '../src/.env'
        )

        for pth in "${config_paths[@]}"; do
            if [ ! -e $pth ]; then
                echo "Missing file (relative path to DIR of script) :$pth"
                exit -1
            fi
        done

        absent_or_newer ingest-ui/src ../src/ingest-ui

        echo 'Checks complete, all good :)'
    elif [ "$1" = "config" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.development.yml -p ingest-ui config
    elif [ "$1" = "build" ]; then
        # Delete the copied source code dir if exists
        if [ -d "ingest-ui/src" ]; then
            rm -rf ingest-ui/src
        fi

        # Copy over the source code
        mkdir ingest-ui/src
        cp -r ../src/* ingest-ui/src
        # Also explicitly copy the .env file
        cp ../src/.env ingest-ui/src

        docker-compose -f docker-compose.yml -f docker-compose.development.yml -p ingest-ui build
    elif [ "$1" = "start" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.development.yml -p ingest-ui up -d
    elif [ "$1" = "stop" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.development.yml -p ingest-ui stop
    elif [ "$1" = "down" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.development.yml -p ingest-ui down
    fi
fi
