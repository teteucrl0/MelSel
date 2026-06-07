#!/usr/bin/env bash
# Sobe MelSell (H2 + backend + Vite) para demo na rede local e exibe o link para outras pessoas.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/mellsell-backend"
FRONTEND="$ROOT/mellsell-frontend"

usage() {
  cat <<'EOF'
Uso: ./start-demo-rede.sh [opções]

  (sem opções)  Sobe MySQL (Podman) + backend e frontend (Vite na rede)
  --stop        Encerra backend (:8080) e frontend (:5173)
  --status      Mostra se os serviços estão rodando e os links
  --test        Sobe os serviços e executa ./test-rede-acesso.sh
  -h, --help    Esta ajuda

Variáveis opcionais:
  MELSELL_ADMIN_EMAIL / MELSELL_ADMIN_PASSWORD  (admin seed do backend)
EOF
}

get_lan_ip() {
  local ip=""
  ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  if [[ -z "$ip" ]]; then
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") print $(i + 1)}')"
  fi
  echo "$ip"
}

port_pid() {
  local port="$1"
  ss -ltnp 2>/dev/null | awk -v p=":$port" '
    $0 ~ p {
      if (match($0, /pid=([0-9]+)/, a)) { print a[1]; exit }
    }
  '
}

wait_http() {
  local url="$1"
  local label="$2"
  local max="${3:-60}"
  local i=0
  while (( i < max )); do
    if curl -sf -o /dev/null "$url" 2>/dev/null; then
      return 0
    fi
    sleep 1
    (( i++ )) || true
  done
  echo "Aviso: $label não respondeu em ${max}s ($url). Confira os logs." >&2
  return 1
}

stop_services() {
  echo "Encerrando MelSell (demo rede)..."

  if [[ -f "$FRONTEND/run-dev.pid" ]]; then
    local fpid
    fpid="$(cat "$FRONTEND/run-dev.pid")"
    if [[ "$fpid" =~ ^[0-9]+$ ]] && ps -p "$fpid" > /dev/null 2>&1; then
      kill "$fpid" 2>/dev/null || true
      sleep 1
      kill -9 "$fpid" 2>/dev/null || true
    fi
    rm -f "$FRONTEND/run-dev.pid"
  fi

  local p5173
  p5173="$(port_pid 5173 || true)"
  if [[ "${p5173:-}" =~ ^[0-9]+$ ]]; then
    kill "$p5173" 2>/dev/null || true
  fi

  if [[ -f "$BACKEND/run-app.pid" ]]; then
    local bpid
    bpid="$(cat "$BACKEND/run-app.pid")"
    if [[ "$bpid" =~ ^[0-9]+$ ]] && ps -p "$bpid" > /dev/null 2>&1; then
      kill "$bpid" 2>/dev/null || true
      sleep 1
    fi
    rm -f "$BACKEND/run-app.pid"
  fi

  local p8080
  p8080="$(port_pid 8080 || true)"
  if [[ "${p8080:-}" =~ ^[0-9]+$ ]]; then
    kill "$p8080" 2>/dev/null || true
  fi

  echo "Serviços encerrados."
}

print_links() {
  local ip="$1"
  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  MelSell — demo na rede (compartilhe com a sala)"
  echo "══════════════════════════════════════════════════════════"
  echo ""
  echo "  Neste computador:"
  echo "    Site:  http://localhost:5173"
  echo "    API:   http://localhost:8080"
  echo ""
  if [[ -n "$ip" ]]; then
    echo "  Outras pessoas (mesmo Wi‑Fi / mesma rede):"
    echo "    Site:  http://${ip}:5173"
    echo "    API:   http://${ip}:8080  (só se precisar testar direto)"
    echo ""
    echo "  Copie e cole no navegador dos colegas:"
    echo "    http://${ip}:5173"
  else
    echo "  Não foi possível detectar o IP da rede. Use: hostname -I"
  fi
  echo ""
  echo "  Admin (seed):  ${MELSELL_ADMIN_EMAIL:-admin@example.com}"
  echo "  Senha admin:   (variável MELSELL_ADMIN_PASSWORD ou admin123 no script do backend)"
  echo ""
  echo "  Logs:"
  echo "    tail -f $BACKEND/run-app.log"
  echo "    tail -f $FRONTEND/run-dev.log"
  echo ""
  echo "  Parar tudo:  ./start-demo-rede.sh --stop"
  echo ""
  echo "  Se outros não abrirem o site, libere o firewall (Fedora):"
  echo "    sudo firewall-cmd --add-port=5173/tcp --add-port=8080/tcp"
  echo "══════════════════════════════════════════════════════════"
  echo ""
}

show_status() {
  local ip
  ip="$(get_lan_ip)"
  local bpid fpid
  bpid="$(port_pid 8080 || true)"
  fpid="$(port_pid 5173 || true)"
  echo "Backend  :8080  ${bpid:+rodando (PID $bpid)}${bpid:-parado}"
  echo "Frontend :5173  ${fpid:+rodando (PID $fpid)}${fpid:-parado}"
  if [[ -n "$bpid" || -n "$fpid" ]]; then
    print_links "$ip"
  fi
}

start_demo() {
  if [[ ! -d "$BACKEND" || ! -d "$FRONTEND" ]]; then
    echo "Erro: execute este script na raiz do repositório MelSel." >&2
    exit 1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "Erro: npm não encontrado. Instale Node.js para subir o frontend." >&2
    exit 1
  fi

  local ip
  ip="$(get_lan_ip)"

  echo "► Subindo backend (MySQL + Flyway)..."
  (cd "$BACKEND" && chmod +x run-mysql.sh && ./run-mysql.sh)

  echo "► Aguardando API na porta 8080..."
  wait_http "http://127.0.0.1:8080/api/products" "Backend" 90 || true

  if [[ ! -d "$FRONTEND/node_modules" ]]; then
    echo "► Instalando dependências do frontend (primeira vez)..."
    (cd "$FRONTEND" && npm install)
  fi

  local old5173
  old5173="$(port_pid 5173 || true)"
  if [[ "${old5173:-}" =~ ^[0-9]+$ ]]; then
    echo "► Encerrando processo anterior na porta 5173 (PID $old5173)..."
    kill "$old5173" 2>/dev/null || true
    sleep 1
  fi

  echo "► Subindo frontend (Vite — acessível na rede)..."
  cd "$FRONTEND"
  nohup npm run dev -- --host 0.0.0.0 --port 5173 > run-dev.log 2>&1 &
  echo $! > run-dev.pid
  cd "$ROOT"

  echo "► Aguardando site na porta 5173..."
  wait_http "http://127.0.0.1:5173/" "Frontend" 45 || true

  print_links "$ip"

  if [[ "${RUN_NETWORK_TESTS:-}" == "1" ]]; then
    echo "► Executando testes de acesso na rede..."
    LAN_IP="$ip" "$ROOT/test-rede-acesso.sh" || true
  fi
}

case "${1:-}" in
  -h|--help)
    usage
    ;;
  --stop)
    stop_services
    ;;
  --status)
    show_status
    ;;
  --test)
    start_demo
    LAN_IP="$(get_lan_ip)" "$ROOT/test-rede-acesso.sh"
    ;;
  "")
    start_demo
    ;;
  *)
    echo "Opção desconhecida: $1" >&2
    usage >&2
    exit 1
    ;;
esac