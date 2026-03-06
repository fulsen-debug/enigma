#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

FAILS=0
WARNS=0

pass() { echo "[env-check] PASS: $1"; }
warn() { echo "[env-check] WARN: $1"; WARNS=$((WARNS + 1)); }
fail() { echo "[env-check] FAIL: $1"; FAILS=$((FAILS + 1)); }

is_number() {
  [[ "${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]]
}

JWT_SECRET="${ENIGMA_JWT_SECRET:-}"
if [[ -z "$JWT_SECRET" ]]; then
  fail "ENIGMA_JWT_SECRET is missing"
elif [[ "$JWT_SECRET" == "change_me_in_production" || ${#JWT_SECRET} -lt 32 ]]; then
  fail "ENIGMA_JWT_SECRET is weak; use 32+ random chars"
else
  pass "ENIGMA_JWT_SECRET present and non-trivial"
fi

if [[ -n "${HELIUS_API_KEY:-}" || -n "${SOLANA_RPC_URL:-}" ]]; then
  pass "RPC provider configured (HELIUS_API_KEY or SOLANA_RPC_URL)"
else
  fail "RPC config missing: set HELIUS_API_KEY or SOLANA_RPC_URL"
fi

EXEC="${ENIGMA_EXECUTION_ENABLED:-0}"
if [[ "$EXEC" == "0" || "$EXEC" == "1" ]]; then
  pass "ENIGMA_EXECUTION_ENABLED valid ($EXEC)"
else
  fail "ENIGMA_EXECUTION_ENABLED must be 0 or 1"
fi

if [[ "$EXEC" == "1" ]]; then
  if [[ -z "${JUPITER_API_KEY:-}" ]]; then
    warn "JUPITER_API_KEY not set; live execution may fail on private routing"
  else
    pass "JUPITER_API_KEY set"
  fi

  if [[ -z "${ENIGMA_TRADER_PRIVATE_KEY:-}" && -z "${ENIGMA_TRADER_PRIVATE_KEY_JSON:-}" ]]; then
    fail "Live execution enabled but trader key is missing"
  else
    pass "Trader key is configured"
  fi

  if [[ "${NODE_ENV:-development}" != "production" ]]; then
    warn "NODE_ENV is not production while execution is enabled"
  else
    pass "NODE_ENV is production"
  fi

  if [[ "${ENIGMA_ALLOW_FREE_LIVE:-0}" == "1" ]]; then
    warn "ENIGMA_ALLOW_FREE_LIVE=1 lowers live-mode plan safety gate"
  fi
fi

for key in \
  ENIGMA_SAFETY_MAX_TOTAL_EXPOSURE_USD \
  ENIGMA_SAFETY_MAX_DAILY_LOSS_USD \
  ENIGMA_SAFETY_MAX_HOURLY_LOSS_USD \
  ENIGMA_SAFETY_MAX_TOKEN_DAILY_LOSS_USD \
  ENIGMA_SAFETY_MAX_TOKEN_HOURLY_LOSS_USD \
  ENIGMA_SAFETY_MAX_LOSS_PER_TRADE_USD \
  ENIGMA_SAFETY_LOSS_STREAK_THRESHOLD \
  ENIGMA_SAFETY_LOSS_STREAK_PAUSE_SEC
do
  value="${!key:-}"
  if [[ -n "$value" ]]; then
    if is_number "$value"; then
      pass "$key=$value"
    else
      fail "$key must be numeric"
    fi
  fi
done

echo "[env-check] RESULT: ${FAILS} fail(s), ${WARNS} warning(s)"
if [[ "$FAILS" -gt 0 ]]; then
  exit 1
fi

