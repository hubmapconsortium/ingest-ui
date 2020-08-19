#!/bin/bash

# Set the version environment variable for the docker build
# Version number is from the VERSION file
# Also remove newlines and leading/trailing slashes if present in that VERSION file
export INGEST_API_VERSION=$(tr -d "\n\r" < ../VERSION | xargs)
echo "INGEST_API_VERSION: $INGEST_API_VERSION"

# Copy over the source code
mkdir ingest-ui/src
cp -r ../src/ingest-ui/* ingest-ui/src
# Also explicitly copy the .env file
cp ../src/ingest-ui/.env ingest-ui/src
