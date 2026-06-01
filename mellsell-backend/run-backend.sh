#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

mvn -DskipTests clean package

export MELSELL_ADMIN_EMAIL="${MELSELL_ADMIN_EMAIL:-admin@example.com}"
export MELSELL_ADMIN_PASSWORD="${MELSELL_ADMIN_PASSWORD:-admin123}"

PORT_PID="$(ss -ltnp 2>/dev/null | awk '/:8080/ { if (match($0,/pid=([0-9]+)/,a)) print a[1] }' | head -n1)"
if [[ "${PORT_PID:-}" =~ ^[0-9]+$ ]]; then
  echo "Stopping process on port 8080: $PORT_PID"
  kill "$PORT_PID" || true
  sleep 1
fi

if [ -f run-app.pid ]; then
  PID=$(cat run-app.pid)
  if [[ "$PID" =~ ^[0-9]+$ ]] && ps -p "$PID" > /dev/null 2>&1; then
    echo "Stopping existing process $PID"
    kill "$PID" || true
    sleep 1
  fi
fi

nohup env MELSELL_ADMIN_EMAIL="$MELSELL_ADMIN_EMAIL" MELSELL_ADMIN_PASSWORD="$MELSELL_ADMIN_PASSWORD" java -jar target/mellsell-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=h2 > run-app.log 2>&1 &
echo $! > run-app.pid

echo "Started backend PID=$(cat run-app.pid)"
tail -f run-app.log
