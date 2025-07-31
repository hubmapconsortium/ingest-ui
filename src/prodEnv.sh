#!/usr/bin/env bash

declare -A test_vars dev_vars prod_vars

echo "Fetching values from dotenv files..."
parse_env_file() {
    local file="$1"
    local -n arr="$2"
    while IFS='=' read -r key value; do
        # Remove leading/trailing whitespace from key and value
        key="${key#"${key%%[![:space:]]*}"}"
        key="${key%"${key##*[![:space:]]}"}"
        value="${value#"${value%%[![:space:]]*}"}"
        value="${value%"${value##*[![:space:]]}"}"
        
        [[ -z "$key" || "$key" =~ ^# ]] && continue
        arr["$key"]="${value//\'/}" # Remove single quotes
        echo "$key - $value"
    done < "$file"
}

parse_env_file ".env.test" test_vars
parse_env_file ".env.development" dev_vars
parse_env_file ".env.production" prod_vars

echo "Patching Production values into static build..."
for key in "${!prod_vars[@]}"; do
    prod_val="${prod_vars[$key]}"
    test_val="${test_vars[$key]}"
    dev_val="${dev_vars[$key]}"
    # Replace test value with prod value
    if [ -n "$test_val" ] && [ "$test_val" != "$prod_val" ]; then
        find ./build -type f -exec sed -i "s|$test_val|$prod_val|g" '{}' +
        # echo "s|$test_val|$prod_val|g"
    fi
    # Replace dev value with prod value
    if [ -n "$dev_val" ] && [ "$dev_val" != "$prod_val" ]; then
        find ./build -type f -exec sed -i "s|$dev_val|$prod_val|g" '{}' +
        # echo "s|$dev_val|$prod_val|g"
    fi
done

echo "Complete! "