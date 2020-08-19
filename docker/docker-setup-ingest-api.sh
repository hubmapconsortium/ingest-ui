#!/bin/bash

if [[ "$1" != "localhost" && "$1" != "dev" && "$1" != "test" && "$1" != "stage" && "$1" != "prod" ]]; then
    echo "Unknown build environment '$1', specify one of the following: 'localhost', 'dev', 'test', 'stage', or 'prod'"
else
    # Set the version environment variable for the docker build
    # Version number is from the VERSION file
    # Also remove newlines and leading/trailing slashes if present in that VERSION file
    export INGEST_API_VERSION=$(tr -d "\n\r" < ../VERSION | xargs)
    echo "INGEST_API_VERSION: $INGEST_API_VERSION"

    # Create docker copy of the source code
    mkdir ingest-api-$1/src
    cp -r ../src/ingest-api/* ingest-api-$1/src
fi

