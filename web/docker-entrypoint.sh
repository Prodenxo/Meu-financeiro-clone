#!/bin/sh
set -e
if [ -f ./server.js ]; then
  exec node server.js
fi
if [ -f ./web/server.js ]; then
  cd web
  exec node server.js
fi
echo "server.js não encontrado (standalone flat ou web/)"
ls -la
ls -la web 2>/dev/null || true
exit 1
