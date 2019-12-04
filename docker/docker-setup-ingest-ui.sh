#!/bin/bash

mkdir ingest-ui/src

# Copy over the src folder
cp -r ../src/ingest-ui/* ingest-ui/src
# Also explicitly copy the .env file
cp ../src/ingest-ui/.env ingest-ui/src
