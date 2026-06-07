#!/usr/bin/env bash
# Sobe o backend com banco H2 em arquivo (dados persistem para a apresentação).
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p data/presentation uploads

export MELSELL_ADMIN_EMAIL="${MELSELL_ADMIN_EMAIL:-admin@example.com}"
export MELSELL_ADMIN_PASSWORD="${MELSELL_ADMIN_PASSWORD:-admin123}"

if [[ ! -f target/mellsell-backend-0.0.1-SNAPSHOT.jar ]]; then
  echo "Compilando backend..."
  mvn -DskipTests -q package
fi

PORT_PID="$(ss -ltnp 2>/dev/null | awk '/:8080/ { if (match($0,/pid=([0-9]+)/,a)) print a[1] }' | head -n1)"
if [[ "${PORT_PID:-}" =~ ^[0-9]+$ ]]; then
  echo "Encerrando processo na porta 8080 (PID $PORT_PID)..."
  kill "$PORT_PID" || true
  sleep 2
fi

if [[ -f run-app.pid ]]; then
  PID="$(cat run-app.pid)"
  if [[ "$PID" =~ ^[0-9]+$ ]] && ps -p "$PID" > /dev/null 2>&1; then
    kill "$PID" || true
    sleep 1
  fi
fi

nohup env \
  MELSELL_ADMIN_EMAIL="$MELSELL_ADMIN_EMAIL" \
  MELSELL_ADMIN_PASSWORD="$MELSELL_ADMIN_PASSWORD" \
  java -jar target/mellsell-backend-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=presentation \
  > run-app.log 2>&1 &

echo $! > run-app.pid

echo ""
echo "MelSell — modo apresentação"
echo "  Perfil:     presentation (H2 em arquivo)"
echo "  Banco:      $(pwd)/data/presentation/"
echo "  API:        http://localhost:8080"
echo "  H2 Console: http://localhost:8080/h2-console  (JDBC URL igual ao application-presentation.properties)"
echo "  Admin:      $MELSELL_ADMIN_EMAIL / (senha definida em MELSELL_ADMIN_PASSWORD)"
echo "  PID:        $(cat run-app.pid)"
echo "  Log:        tail -f run-app.log"
echo ""
echo "Painel do fornecedor: entre com conta APICULTOR (vendedor), não com admin@example.com."
echo "Cadastre apicultor e produtos uma vez; os dados permanecem após reiniciar."
echo "Para zerar a base: rm -rf data/presentation && mkdir -p data/presentation"