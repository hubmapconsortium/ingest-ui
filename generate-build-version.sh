#!/bin/bash

# Print a new line and the banner
echo
echo "==================== INGEST-API ===================="

# Generate the build version based on git branch name and short commit hash and write into BUILD file
function generate_build_version() {
    GIT_BRANCH_NAME=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
    GIT_SHORT_COMMIT_HASH=$(git rev-parse --short HEAD)
    # Clear the old BUILD version and write the new one
    truncate -s 0 BUILD
    # Note: echo to file appends newline
    echo $GIT_BRANCH_NAME:$GIT_SHORT_COMMIT_HASH >> BUILD
    # Remmove the trailing newline character
    truncate -s -1 BUILD

    echo "BUILD(git branch name:short commit hash): $GIT_BRANCH_NAME:$GIT_SHORT_COMMIT_HASH"
}

generate_build_version