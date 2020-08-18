#!/bin/bash

# Set the version environment variable for the docker build
# Version number is from the VERSION file
export INGEST_API_VERSION=$(tr -d "\n\r" < VERSION | xargs)

echo "INGEST_API_VERSION: $INGEST_API_VERSION"

mkdir ingest-api-prod/src

# Copy over the src folder
cp -r ../src/ingest-api/* ingest-api-prod/src

