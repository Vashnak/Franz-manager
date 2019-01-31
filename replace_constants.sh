#!/usr/bin/sh

sed -i "s~%SERVER_URL%~${SERVER_URL:-}~g; s~%WEBSOCKET_SERVER_URL%~${WEBSOCKET_SERVER_URL:-}~g" ${BASE_NGINX}/${APP}/app.js
