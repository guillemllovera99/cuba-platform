#!/bin/sh
# Default PORT to 3000 for local Docker Compose; Railway overrides via env
export PORT="${PORT:-3000}"
# Default BACKEND_URL for local; Railway/Render override via env
export BACKEND_URL="${BACKEND_URL:-http://backend:8000}"

# Substitute PORT and BACKEND_URL, leaving nginx variables ($host, etc.) untouched
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo "nginx: listening on port ${PORT}, proxying API to ${BACKEND_URL}"
exec "$@"
