#!/bin/bash

mkdir ingest-api/src
mkdir ingest-ui/src

# Copy over the src folder
cp -r ../src/ingest-api/* ingest-api/src
cp -r ../src/ingest-ui/* ingest-ui/src
