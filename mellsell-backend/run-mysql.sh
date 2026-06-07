#!/usr/bin/env bash
# Sobe MySQL (Podman/Docker) + backend com Flyway.
set -euo pipefail
cd "$(dirname "$0")"

RUNTIME=""
if command -v podman >/dev/null 2>&1; then
  RUNTIME=podman
elif command -v docker >/dev/null 2>&1; then
  RUNTIME=docker
fi

COMPOSE_CMD=""
if [[ -n "$RUNTIME" ]] && $RUNTIME compose version >/dev/null 2>&1; then
  COMPOSE_CMD="$RUNTIME compose"
elif command -v podman-compose >/dev/null 2>&1; then
  COMPOSE_CMD="podman-compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
fi

mkdir -p uploads

export MELSELL_ADMIN_EMAIL="${MELSELL_ADMIN_EMAIL:-admin@example.com}"
export MELSELL_ADMIN_PASSWORD="${MELSELL_ADMIN_PASSWORD:-admin123}"
export MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
export MYSQL_PORT="${MYSQL_PORT:-3306}"
export MYSQL_DATABASE="${MYSQL_DATABASE:-mellsell}"
export MYSQL_USER="${MYSQL_USER:-mellsell}"
export MYSQL_PASSWORD="${MYSQL_PASSWORD:-mellsell}"

start_mysql() {
  if [[ -n "$COMPOSE_CMD" ]]; then
    echo "► Subindo MySQL ($COMPOSE_CMD)..."
    $COMPOSE_CMD -f docker-compose.mysql.yml up -d
    echo "► Aguardando MySQL ficar pronto..."
    local i=0
    while (( i < 60 )); do
      if $COMPOSE_CMD -f docker-compose.mysql.yml exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -proot --silent 2>/dev/null; then
        return 0
      fi
      sleep 2
      (( i++ )) || true
    done
    echo "MySQL não respondeu a tempo. Veja: $COMPOSE_CMD -f docker-compose.mysql.yml logs mysql" >&2
    exit 1
  fi

  if [[ -n "$RUNTIME" ]]; then
    if ! $RUNTIME ps --format '{{.Names}}' 2>/dev/null | grep -qx 'mellsell-mysql'; then
      echo "► Subindo MySQL ($RUNTIME run)..."
      $RUNTIME run -d --name mellsell-mysql \
        -e MYSQL_ROOT_PASSWORD=root \
        -e MYSQL_DATABASE=mellsell \
        -e MYSQL_USER=mellsell \
        -e MYSQL_PASSWORD=mellsell \
        -p 3306:3306 \
        -v mellsell_mysql_data:/var/lib/mysql \
        docker.io/library/mysql:8.0
    else
      $RUNTIME start mellsell-mysql 2>/dev/null || true
    fi
    local i=0
    while (( i < 60 )); do
      if $RUNTIME exec mellsell-mysql mysqladmin ping -h 127.0.0.1 -uroot -proot --silent 2>/dev/null; then
        return 0
      fi
      sleep 2
      (( i++ )) || true
    done
    echo "MySQL (container mellsell-mysql) não respondeu a tempo." >&2
    exit 1
  fi

  if ss -ltn 2>/dev/null | grep -q ':3306'; then
    echo "► MySQL já escutando na porta 3306 (instalação local)."
    return 0
  fi

  echo "Erro: instale Podman/Docker ou MySQL local na porta 3306." >&2
  exit 1
}

stop_old_backend() {
  local p8080
  p8080="$(ss -ltnp 2>/dev/null | awk '/:8080/ { if (match($0,/pid=([0-9]+)/,a)) print a[1] }' | head -n1)"
  if [[ "${p8080:-}" =~ ^[0-9]+$ ]]; then
    kill "$p8080" 2>/dev/null || true
    sleep 1
  fi
  if [[ -f run-app.pid ]]; then
    local pid
    pid="$(cat run-app.pid)"
    if [[ "$pid" =~ ^[0-9]+$ ]] && ps -p "$pid" > /dev/null 2>&1; then
      kill "$pid" 2>/dev/null || true
      sleep 1
    fi
  fi
}

case "${1:-}" in
  --stop-mysql)
    if [[ -n "$COMPOSE_CMD" ]]; then
      $COMPOSE_CMD -f docker-compose.mysql.yml down
    fi
    exit 0
    ;;
  --mysql-only)
    start_mysql
    echo "MySQL pronto em ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
    exit 0
    ;;
esac

start_mysql

echo "► Compilando backend..."
mvn -q -DskipTests package

stop_old_backend

echo "► Subindo API (perfil mysql + Flyway)..."
nohup env \
  MELSELL_ADMIN_EMAIL="$MELSELL_ADMIN_EMAIL" \
  MELSELL_ADMIN_PASSWORD="$MELSELL_ADMIN_PASSWORD" \
  MYSQL_HOST="$MYSQL_HOST" \
  MYSQL_PORT="$MYSQL_PORT" \
  MYSQL_DATABASE="$MYSQL_DATABASE" \
  MYSQL_USER="$MYSQL_USER" \
  MYSQL_PASSWORD="$MYSQL_PASSWORD" \
  java -jar target/mellsell-backend-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=mysql \
  > run-app.log 2>&1 &

echo $! > run-app.pid

echo "► Aguardando API..."
for i in $(seq 1 45); do
  if curl -sf -o /dev/null "http://127.0.0.1:8080/api/products?page=0&size=1" 2>/dev/null; then
    break
  fi
  sleep 1
done

echo ""
echo "MelSell — MySQL"
echo "  Banco:  ${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
echo "  API:    http://localhost:8080"
echo "  Admin:  ${MELSELL_ADMIN_EMAIL} / ${MELSELL_ADMIN_PASSWORD}"
echo "  PID:    $(cat run-app.pid)"
echo "  Log:    tail -f run-app.log"
echo ""