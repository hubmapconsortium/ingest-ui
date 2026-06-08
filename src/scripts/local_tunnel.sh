#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-${PORT:-8585}}"
LOCAL_HOST="${LOCAL_HOST:-127.0.0.1}"
TARGET_URL="http://${LOCAL_HOST}:${PORT}"

if command -v cloudflared >/dev/null 2>&1; then
  echo "Starting Cloudflare tunnel for ${TARGET_URL}"
  exec cloudflared tunnel --no-autoupdate --url "${TARGET_URL}"
fi

if command -v npx >/dev/null 2>&1; then
  echo "Starting localtunnel for port ${PORT}"
  exec npx --yes localtunnel --port "${PORT}" --local-host "${LOCAL_HOST}"
fi

echo "Neither 'cloudflared' nor 'npx' is available on PATH."
echo "Install one of them, then re-run this script."
echo "Examples:"
echo "  npm install -g localtunnel"
echo "  sudo apt-get install cloudflared"
exit 1
