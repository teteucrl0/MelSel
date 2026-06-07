#!/usr/bin/env bash
# Testes de acesso ao MelSell por outro IP na rede local (simula o cliente na sala).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

PASS=0
FAIL=0
SKIP=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

get_lan_ip() {
  if [[ -n "${LAN_IP:-}" ]]; then
    echo "$LAN_IP"
    return
  fi
  local ip
  ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  if [[ -z "$ip" ]]; then
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") print $(i + 1)}')"
  fi
  echo "$ip"
}

assert_ok() {
  local name="$1"
  shift
  if "$@"; then
    echo -e "${GREEN}✓${NC} $name"
    (( PASS++ )) || true
    return 0
  fi
  echo -e "${RED}✗${NC} $name"
  (( FAIL++ )) || true
  return 1
}

assert_skip() {
  echo -e "${YELLOW}○${NC} $1 (ignorado)"
  (( SKIP++ )) || true
}

CURL_OPTS=(--max-time 15 -s)

curl_code() {
  curl "${CURL_OPTS[@]}" -o /dev/null -w "%{http_code}" "$@"
}

curl_cors_preflight() {
  local origin="$1"
  curl "${CURL_OPTS[@]}" -o /dev/null -w "%{http_code}" -X OPTIONS \
    -H "Origin: $origin" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    "http://127.0.0.1:${BACKEND_PORT}/api/auth/login"
}

listen_all_interfaces() {
  local port="$1"
  ss -ltn 2>/dev/null | awk -v p=":${port}" '$0 ~ p && $0 !~ /127.0.0.1:'"$port"'/ { found=1 } END { exit !found }'
}

main() {
  local lan_ip
  lan_ip="$(get_lan_ip)"

  echo ""
  echo "MelSell — testes de acesso por outro IP (rede local)"
  echo "  IP detectado: ${lan_ip:-não encontrado}"
  echo "  Backend:      :${BACKEND_PORT}"
  echo "  Frontend:     :${FRONTEND_PORT}"
  echo ""

  if [[ -z "$lan_ip" ]]; then
    echo -e "${RED}Defina LAN_IP=192.168.x.x se a detecção automática falhar.${NC}"
    exit 1
  fi

  # --- Serviços rodando? ---
  if [[ "$(curl_code "http://127.0.0.1:${BACKEND_PORT}/api/products")" != "200" ]]; then
    echo -e "${RED}Backend não está em http://127.0.0.1:${BACKEND_PORT}${NC}"
    echo "  Suba com: ./start-demo-rede.sh"
    exit 1
  fi

  if [[ "$(curl_code "http://127.0.0.1:${FRONTEND_PORT}/")" != "200" ]]; then
    echo -e "${RED}Frontend não está em http://127.0.0.1:${FRONTEND_PORT}${NC}"
    echo "  Suba com: ./start-demo-rede.sh"
    exit 1
  fi

  # --- Portas acessíveis na rede (não só localhost) ---
  if listen_all_interfaces "$BACKEND_PORT"; then
    assert_ok "Backend escuta na rede (porta ${BACKEND_PORT} além de 127.0.0.1)" true
  else
    assert_ok "Backend escuta na rede (porta ${BACKEND_PORT})" false
    echo "    Dica: Spring Boot já usa 0.0.0.0 por padrão; confira firewall."
  fi

  if listen_all_interfaces "$FRONTEND_PORT"; then
    assert_ok "Frontend escuta na rede (porta ${FRONTEND_PORT})" true
  else
    assert_ok "Frontend escuta na rede (porta ${FRONTEND_PORT})" false
    echo "    Dica: use npm run dev -- --host 0.0.0.0 (start-demo-rede.sh já faz isso)."
  fi

  # --- Acesso direto pelo IP da LAN ---
  assert_ok "API pelo IP LAN (GET /api/products)" \
    test "$(curl_code "http://${lan_ip}:${BACKEND_PORT}/api/products")" = "200"

  assert_ok "Site pelo IP LAN (GET /)" \
    test "$(curl_code "http://${lan_ip}:${FRONTEND_PORT}/")" = "200"

  assert_ok "Proxy Vite: API pelo IP LAN (GET /api/products)" \
    test "$(curl_code "http://${lan_ip}:${FRONTEND_PORT}/api/products")" = "200"

  assert_ok "Proxy Vite: CEP pelo IP LAN" \
    test "$(curl_code "http://${lan_ip}:${FRONTEND_PORT}/api/address/cep/01310100")" = "200"

  # --- CORS (navegador de outro PC envia Origin com o IP) ---
  local origin="http://${lan_ip}:${FRONTEND_PORT}"
  local cors_code cors_bad
  cors_code="$(curl_cors_preflight "$origin")"
  if [[ "$cors_code" == "200" || "$cors_code" == "204" ]]; then
    assert_ok "CORS preflight (Origin ${origin} → ${cors_code})" true
  else
    assert_ok "CORS preflight (Origin ${origin} → ${cors_code})" false
  fi

  cors_bad="$(curl_cors_preflight "http://malicious-site.example:5173")"
  if [[ "$cors_bad" == "403" || "$cors_bad" == "000" ]]; then
    assert_ok "CORS preflight rejeita origem externa (${cors_bad})" true
  else
    assert_ok "CORS preflight rejeita origem externa (${cors_bad})" false
  fi

  # --- WebSocket (SockJS info) ---
  assert_ok "WebSocket SockJS info pelo IP LAN" \
    test "$(curl_code "http://${lan_ip}:${BACKEND_PORT}/ws/info")" = "200"

  # --- Cadastro de cliente pelo IP (API direta, como outro dispositivo) ---
  local test_email="rede-test-$(date +%s)@mellsell.local"
  local reg_code
  reg_code="$(curl "${CURL_OPTS[@]}" -o /tmp/mellsell-reg.json -w "%{http_code}" -X POST \
    "http://${lan_ip}:${BACKEND_PORT}/api/auth/register" \
    -H "Content-Type: application/json" \
    -H "Origin: ${origin}" \
    -d "{\"name\":\"Cliente Rede\",\"email\":\"${test_email}\",\"password\":\"Rede@1234\",\"birthDate\":\"1995-06-15\"}")"

  assert_ok "Registro de cliente pelo IP LAN (POST /api/auth/register → 201)" \
    test "$reg_code" = "201"

  # --- Login pelo proxy (fluxo real do navegador na porta 5173) ---
  if [[ "$reg_code" == "201" ]]; then
    assert_ok "Login pelo proxy Vite no IP LAN" \
      test "$(curl "${CURL_OPTS[@]}" -o /dev/null -w "%{http_code}" -X POST \
        "http://${lan_ip}:${FRONTEND_PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -H "Origin: ${origin}" \
        -d "{\"email\":\"${test_email}\",\"password\":\"Rede@1234\"}")" = "200"
  else
    assert_skip "Login pelo proxy (registro falhou)"
  fi

  echo ""
  echo "────────────────────────────────────────"
  echo -e "  ${GREEN}Passou: ${PASS}${NC}  ${RED}Falhou: ${FAIL}${NC}  ${YELLOW}Ignorados: ${SKIP}${NC}"
  echo ""
  echo "  Link para compartilhar na rede:"
  echo "    http://${lan_ip}:${FRONTEND_PORT}"
  echo "────────────────────────────────────────"
  echo ""

  if (( FAIL > 0 )); then
    exit 1
  fi
}

main "$@"