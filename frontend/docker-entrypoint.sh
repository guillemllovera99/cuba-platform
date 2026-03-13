#!/bin/sh
# Substitute only BACKEND_URL, leaving nginx variables ($host, etc.) untouched
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
exec "$@"
